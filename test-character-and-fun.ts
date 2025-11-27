/**
 * Test Character and Fun Factor
 *
 * Verifies that AI coach has personality, makes it enjoyable, and helps with self-discovery:
 * - Uses playful language
 * - Shows enthusiasm
 * - Asks self-discovery questions
 * - Makes students want to keep working
 */

import 'dotenv/config';
import { buildPIQChatContext } from './src/services/piqWorkshop/piqChatContext';
import { sendPIQChatMessage } from './src/services/piqWorkshop/piqChatService';
import fs from 'fs/promises';

// Simple essay for testing character/tone
const TEST_ESSAY = {
  promptId: 'piq1',
  promptTitle: 'Leadership Experience',
  promptText: 'Describe an example of your leadership experience.',
  draft: `I founded our school's first Environmental Action Club. At first only three people showed up to our beach cleanup. But I researched plastic pollution data and presented to the school board. They approved funding for water refill stations. Now we have 45 members and reduced plastic waste by 47%.`,
  nqi: 65,
  initialNqi: 58,
};

const MOCK_ANALYSIS = {
  analysis: { narrative_quality_index: 65 },
  voiceFingerprint: {
    sentenceStructure: { pattern: 'Short, direct sentences', example: 'I founded our school\'s first Environmental Action Club.' },
    vocabulary: { level: 'Clear and accessible', signatureWords: ['founded', 'researched', 'reduced'] },
    pacing: { speed: 'Quick', rhythm: 'Staccato' },
    tone: { primary: 'Matter-of-fact', secondary: 'Determined' },
  },
  experienceFingerprint: {
    uniqueElements: {},
    antiPatternFlags: { followsTypicalArc: true, hasGenericInsight: false, hasManufacturedBeat: false, hasCrowdPleaser: false, warnings: ['Summary-style writing, not scene-based'] },
    divergenceRequirements: { mustInclude: [], mustAvoid: [], uniqueAngle: '', authenticTension: '' },
    qualityAnchors: [{ sentence: 'At first only three people showed up to our beach cleanup.', whyItWorks: 'Shows vulnerability and starting small', preservationPriority: 'high' as const }],
    confidenceScore: 6,
  },
  rubricDimensionDetails: [],
  workshopItems: [],
};

async function runTest(question: string, testName: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${testName}`);
  console.log(`${'='.repeat(80)}\n`);

  const context = buildPIQChatContext(
    TEST_ESSAY.promptId,
    TEST_ESSAY.promptText,
    TEST_ESSAY.promptTitle,
    TEST_ESSAY.draft,
    MOCK_ANALYSIS as any,
    {
      currentScore: TEST_ESSAY.nqi,
      initialScore: TEST_ESSAY.initialNqi,
      hasUnsavedChanges: false,
      needsReanalysis: false,
    }
  );

  try {
    const response = await sendPIQChatMessage({
      userMessage: question,
      context,
      conversationHistory: [],
    });

    console.log(`QUESTION: "${question}"\n`);
    console.log(`RESPONSE:\n${response.message.content}\n`);
    console.log(`${'─'.repeat(80)}\n`);

    const analysis = analyzeCharacter(response.message.content);
    console.log(`CHARACTER & FUN ANALYSIS:`);
    console.log(`- Uses playful language: ${analysis.usesPlayfulLanguage ? '✅' : '❌'} ${analysis.playfulPhrases.length > 0 ? `(found: ${analysis.playfulPhrases.join(', ')})` : ''}`);
    console.log(`- Shows enthusiasm: ${analysis.showsEnthusiasm ? '✅' : '❌'} ${analysis.enthusiasmMarkers.length > 0 ? `(found: ${analysis.enthusiasmMarkers.join(', ')})` : ''}`);
    console.log(`- Asks discovery questions: ${analysis.asksDiscoveryQuestions ? '✅' : '❌'} ${analysis.discoveryQuestions.length > 0 ? `(${analysis.discoveryQuestions.length} questions)` : ''}`);
    console.log(`- Has personality (not robotic): ${analysis.hasPersonality ? '✅' : '❌'}`);
    console.log(`- Makes it feel collaborative: ${analysis.feelsCollaborative ? '✅' : '❌'}`);
    console.log();

    return {
      testName,
      question,
      response: response.message.content,
      analysis,
    };
  } catch (error) {
    console.error(`❌ Test failed:`, error);
    return {
      testName,
      question,
      response: `ERROR: ${error instanceof Error ? error.message : String(error)}`,
      analysis: null,
    };
  }
}

function analyzeCharacter(response: string) {
  const lower = response.toLowerCase();

  // Playful language markers
  const playfulPatterns = [
    { pattern: /chef'?s kiss/i, name: "chef's kiss" },
    { pattern: /real talk/i, name: 'real talk' },
    { pattern: /okay[,\s]+(so|wait)/i, name: 'okay so/wait' },
    { pattern: /here'?s the fun part/i, name: "here's the fun part" },
    { pattern: /wild/i, name: 'wild' },
    { pattern: /gold/i, name: 'gold' },
    { pattern: /this is it/i, name: 'this is it' },
    { pattern: /hear me out/i, name: 'hear me out' },
  ];

  const playfulPhrases: string[] = [];
  playfulPatterns.forEach(p => {
    if (p.pattern.test(response)) playfulPhrases.push(p.name);
  });
  const usesPlayfulLanguage = playfulPhrases.length > 0;

  // Enthusiasm markers
  const enthusiasmMarkers: string[] = [];
  if (response.includes('!')) enthusiasmMarkers.push('exclamation marks');
  if (response.includes('*')) enthusiasmMarkers.push('emphasis (*asterisks*)');
  if (/love|amazing|perfect|exactly|yes/i.test(response)) enthusiasmMarkers.push('positive words');
  if (/THAT'?S|THIS/i.test(response) && response.toUpperCase().includes(response.match(/THAT'?S|THIS/)?.[0] || '')) enthusiasmMarkers.push('emphasis caps');
  const showsEnthusiasm = enthusiasmMarkers.length >= 2;

  // Discovery questions
  const discoveryQuestions: string[] = [];
  const questionMatches = response.match(/\?[^?]*$/g) || [];
  const questions = response.split('?').filter(q => q.trim().length > 10);

  questions.forEach(q => {
    const lowerQ = q.toLowerCase();
    if (/what (were|was|did|does) (you|this)|why|how/i.test(lowerQ)) {
      // Extract just the question
      const question = q.split(/\. (?=[A-Z])/).pop()?.trim();
      if (question && question.length > 20) {
        discoveryQuestions.push(question.substring(0, 60) + (question.length > 60 ? '...' : ''));
      }
    }
  });
  const asksDiscoveryQuestions = discoveryQuestions.length > 0;

  // Personality (not robotic)
  const hasPersonality =
    usesPlayfulLanguage ||
    /you|we|i|let'?s/i.test(response) &&
    !/per.*rubric|dimension.*score|implement.*changes|suboptimal/i.test(response);

  // Collaborative feel
  const feelsCollaborative =
    /want to|should we|let'?s|we can|together/i.test(response) ||
    response.split('?').length >= 2; // Asks multiple questions

  return {
    usesPlayfulLanguage,
    playfulPhrases,
    showsEnthusiasm,
    enthusiasmMarkers,
    asksDiscoveryQuestions,
    discoveryQuestions,
    hasPersonality,
    feelsCollaborative,
  };
}

async function runAllTests() {
  console.log('\n🎭 TESTING CHARACTER AND FUN FACTOR\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ No ANTHROPIC_API_KEY found in environment');
    process.exit(1);
  }

  const results = [];

  // Test 1: Student asks for general help - should be enthusiastic and guide discovery
  results.push(
    await runTest(
      "How can I make this better?",
      'Test 1: General Help - Should Be Enthusiastic & Ask Discovery Questions'
    )
  );

  // Test 2: Student shares frustration - should be empathetic and make it fun
  results.push(
    await runTest(
      "I hate writing essays",
      'Test 2: Student Frustration - Should Be Empathetic & Make It Fun'
    )
  );

  // Test 3: Student achieved something - should celebrate with personality
  results.push(
    await runTest(
      "I just added more details about the board meeting!",
      'Test 3: Student Achievement - Should Celebrate with Enthusiasm'
    )
  );

  // Test 4: Student asks about themselves - should guide self-discovery
  results.push(
    await runTest(
      "What does this essay say about me?",
      'Test 4: Self-Discovery Question - Should Ask Probing Questions'
    )
  );

  // Save results
  const markdown = generateMarkdownReport(results);
  await fs.writeFile('CHARACTER_FUN_TEST_RESULTS.md', markdown);

  console.log('\n✅ All tests complete!');
  console.log('📄 Results saved to: CHARACTER_FUN_TEST_RESULTS.md\n');

  // Summary
  const totalChecks = results.reduce((sum, r) => {
    if (!r.analysis) return sum;
    return sum + Object.values(r.analysis).filter(v => typeof v === 'boolean' && v).length;
  }, 0);
  const maxChecks = results.filter(r => r.analysis).length * 5; // 5 boolean checks per test

  console.log(`\n📊 OVERALL CHARACTER SCORE: ${totalChecks}/${maxChecks} checks passed (${((totalChecks/maxChecks)*100).toFixed(0)}%)\n`);
}

function generateMarkdownReport(results: any[]) {
  let md = `# Character & Fun Factor Test Results\n\n`;
  md += `**Test Date**: ${new Date().toISOString()}\n`;
  md += `**Purpose**: Verify AI coach has personality, makes it enjoyable, guides self-discovery\n\n`;
  md += `---\n\n`;

  results.forEach((result) => {
    md += `## ${result.testName}\n\n`;
    md += `**Student Question**: "${result.question}"\n\n`;
    md += `**AI Coach Response**:\n${result.response}\n\n`;

    if (result.analysis) {
      md += `**✅ Character Analysis**:\n`;
      md += `- ${result.analysis.usesPlayfulLanguage ? '✅' : '❌'} Uses playful language`;
      if (result.analysis.playfulPhrases.length > 0) {
        md += ` (${result.analysis.playfulPhrases.join(', ')})`;
      }
      md += `\n`;

      md += `- ${result.analysis.showsEnthusiasm ? '✅' : '❌'} Shows enthusiasm`;
      if (result.analysis.enthusiasmMarkers.length > 0) {
        md += ` (${result.analysis.enthusiasmMarkers.join(', ')})`;
      }
      md += `\n`;

      md += `- ${result.analysis.asksDiscoveryQuestions ? '✅' : '❌'} Asks discovery questions`;
      if (result.analysis.discoveryQuestions.length > 0) {
        md += `\n`;
        result.analysis.discoveryQuestions.forEach((q: string) => {
          md += `  - "${q}"\n`;
        });
      } else {
        md += `\n`;
      }

      md += `- ${result.analysis.hasPersonality ? '✅' : '❌'} Has personality (not robotic)\n`;
      md += `- ${result.analysis.feelsCollaborative ? '✅' : '❌'} Makes it feel collaborative\n\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

// Run tests
runAllTests().catch(console.error);
