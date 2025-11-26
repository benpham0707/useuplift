/**
 * Test Context Utilization
 *
 * Verifies that AI coach properly uses all the rich analysis context:
 * - Voice fingerprint
 * - Experience fingerprint (quality anchors, anti-patterns)
 * - Workshop items (with 3 suggestion types)
 * - Rubric dimensions
 * - Word count awareness
 */

import 'dotenv/config';
import { buildPIQChatContext } from './src/services/piqWorkshop/piqChatContext';
import { sendPIQChatMessage } from './src/services/piqWorkshop/piqChatService';
import fs from 'fs/promises';

// ============================================================================
// MOCK ESSAY WITH FULL ANALYSIS CONTEXT
// ============================================================================

const LEADERSHIP_ESSAY = {
  promptId: 'piq1',
  promptTitle: 'Leadership Experience',
  promptText: 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.',
  draft: `I have always been passionate about environmental issues. During my junior year, I founded the Environmental Action Club at my school with three members.

At first, our beach cleanups attracted only a handful of students. But I knew we needed to think bigger. I researched plastic pollution data and crafted a proposal for the school administration.

The breakthrough came when I presented to the school board. My voice shook with nervousness, but I pushed through. I showed them statistics proving our campus generated over 2,000 plastic bottles weekly. The board approved funding for water refill stations across all buildings.

Within one semester, we reduced single-use plastic waste by 47% and grew our club membership to 45 active members. This experience taught me that leadership is about channeling collective passion into measurable change.`,
  wordCount: 132,
  nqi: 68,
  initialNqi: 58,
};

// Full analysis result with ALL context
const FULL_ANALYSIS = {
  analysis: {
    narrative_quality_index: 68,
  },

  // Voice Fingerprint
  voiceFingerprint: {
    sentenceStructure: {
      pattern: 'Formal essay structure with varied sentence lengths',
      example: 'I researched plastic pollution data and crafted a proposal for the school administration.',
    },
    vocabulary: {
      level: 'Academic formal with some generic phrases',
      signatureWords: ['passionate', 'breakthrough', 'channeling', 'collective'],
    },
    pacing: {
      speed: 'Measured and methodical',
      rhythm: 'Even, predictable',
    },
    tone: {
      primary: 'Earnest and mission-driven',
      secondary: 'Slightly formal',
    },
  },

  // Experience Fingerprint with Quality Anchors
  experienceFingerprint: {
    uniqueElements: {
      specificSensoryAnchor: {
        sensory: '"My voice shook with nervousness"',
        context: 'Board presentation moment',
        emotionalWeight: 'Shows vulnerability in leadership',
      },
    },
    antiPatternFlags: {
      followsTypicalArc: true,
      hasGenericInsight: true,
      hasManufacturedBeat: false,
      hasCrowdPleaser: false,
      warnings: [
        'Follows typical challenge→overcome→growth arc used by 47% of PIQ essays',
        'Opening "I have always been passionate" is generic throat-clearing',
        'Conclusion "This experience taught me" is formulaic',
      ],
    },
    divergenceRequirements: {
      mustInclude: ['Specific board presentation moment', 'Student recruitment challenges'],
      mustAvoid: ['Generic passion statements', 'Formulaic conclusions'],
      uniqueAngle: 'Focus on the voice-shaking vulnerability moment at the board',
      authenticTension: 'High schooler presenting to skeptical adults',
    },
    qualityAnchors: [
      {
        sentence: 'My voice shook with nervousness, but I pushed through.',
        whyItWorks: 'Shows physical vulnerability and determination without manufactured drama',
        preservationPriority: 'critical' as const,
      },
      {
        sentence: 'The board approved funding for water refill stations across all buildings.',
        whyItWorks: 'Specific, tangible outcome—not vague "made an impact"',
        preservationPriority: 'high' as const,
      },
    ],
    confidenceScore: 6.5,
  },

  // Rubric Dimensions
  rubricDimensionDetails: [
    {
      dimension_name: 'opening_hook',
      raw_score: 4,
      final_score: 4,
      evidence: {
        justification: 'Opens with generic mission statement instead of scene or tension',
        strengths: [],
        weaknesses: ['Generic throat-clearing ("I have always been passionate")', 'No immediate scene or stakes'],
      },
    },
    {
      dimension_name: 'stakes_tension',
      raw_score: 5.5,
      final_score: 5.5,
      evidence: {
        justification: 'Minimal tension—success feels inevitable from the start',
        strengths: ['Voice shaking moment shows some vulnerability'],
        weaknesses: ['No sense of risk or potential failure', 'Outcome presented as foregone conclusion'],
      },
    },
    {
      dimension_name: 'conclusion_reflection',
      raw_score: 4.5,
      final_score: 4.5,
      evidence: {
        justification: 'Generic "this experience taught me" formula',
        strengths: ['At least tries to articulate a takeaway'],
        weaknesses: ['"Channeling collective passion" is vague corporate-speak', 'No personal growth shown—just stated'],
      },
    },
    {
      dimension_name: 'prompt_responsiveness',
      raw_score: 7,
      final_score: 7,
      evidence: {
        justification: 'Addresses leadership prompt adequately with founding club and presenting',
        strengths: ['Shows initiative (founding club)', 'Shows influence (board presentation, growing membership)'],
        weaknesses: ['Could dig deeper into HOW they influenced skeptical board members'],
      },
    },
  ],

  // Workshop Items with 3 suggestion types
  workshopItems: [
    {
      id: 'ws-001',
      rubric_category: 'opening_hook',
      severity: 'critical' as const,
      quote: 'I have always been passionate about environmental issues.',
      problem: 'Generic throat-clearing that wastes the opening',
      why_it_matters: 'First sentence must hook the reader—this reads like every other essay. Opens with telling, not showing.',
      suggestions: [
        {
          type: 'polished_original' as const,
          text: 'Delete this sentence entirely. Start with "During my junior year, I founded..."',
          rationale: 'Your actions show your passion—don\'t waste words stating it. Start with the story.',
        },
        {
          type: 'voice_amplifier' as const,
          text: 'Start with the board room: "My voice shook as I stood before the school board with slides showing 2,000 plastic bottles."',
          rationale: 'Opens with vulnerability and stakes. Drops reader into your pivotal moment.',
        },
        {
          type: 'divergent_strategy' as const,
          text: 'Start with a problem: "Three students showed up to our first beach cleanup. We collected 47 bottles. I knew this wasn\'t going to work."',
          rationale: 'Opens with failure/struggle, not success. More compelling arc.',
        },
      ],
    },
    {
      id: 'ws-002',
      rubric_category: 'conclusion_reflection',
      severity: 'critical' as const,
      quote: 'This experience taught me that leadership is about channeling collective passion into measurable change.',
      problem: 'Generic "this experience taught me" conclusion with vague corporate buzzwords',
      why_it_matters: 'Every other leadership essay ends this way. "Channeling collective passion" could mean anything. Not specific to YOUR experience.',
      suggestions: [
        {
          type: 'polished_original' as const,
          text: 'Leadership means making adults listen when you\'re 16 and your voice shakes.',
          rationale: 'Specific to YOUR experience (age, vulnerability). Concrete, not abstract.',
        },
        {
          type: 'voice_amplifier' as const,
          text: 'I learned that 47% sounds impressive, but the real win was making sustainability normal—not a "club thing."',
          rationale: 'Keeps your data-driven voice but adds depth about cultural shift vs. metrics.',
        },
        {
          type: 'divergent_strategy' as const,
          text: 'Delete generic conclusion. End with: "Last week, a freshman asked if we still do beach cleanups. We do. Every month. Without me."',
          rationale: 'Shows leadership = building something that outlasts you. Ends with scene, not summary.',
        },
      ],
    },
    {
      id: 'ws-003',
      rubric_category: 'stakes_tension',
      severity: 'warning' as const,
      quote: 'The board approved funding for water refill stations across all buildings.',
      problem: 'Success without showing the struggle or doubt',
      why_it_matters: 'Readers want to see the moment BEFORE approval—when you weren\'t sure if they\'d say yes. Stakes come from uncertainty.',
      suggestions: [
        {
          type: 'polished_original' as const,
          text: 'Add before the approval: "The board chair looked skeptical. \'How much will this cost?\' I hadn\'t prepared for that question."',
          rationale: 'Shows a moment of doubt/challenge. Adds tension before the win.',
        },
        {
          type: 'voice_amplifier' as const,
          text: 'Expand the shaking voice moment: "My voice shook. I could see two board members checking their phones. If I lost them now..."',
          rationale: 'Amplifies your existing vulnerability beat. Shows risk of failure.',
        },
        {
          type: 'divergent_strategy' as const,
          text: 'What if they said NO first? "The board denied funding in November. I spent winter break researching grants..." Then show the second try.',
          rationale: 'Failure → persistence → eventual success is more compelling than straight success.',
        },
      ],
    },
  ],
};

// ============================================================================
// TEST SCENARIOS
// ============================================================================

async function runTest(question: string, testName: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${testName}`);
  console.log(`${'='.repeat(80)}\n`);

  const context = buildPIQChatContext(
    LEADERSHIP_ESSAY.promptId,
    LEADERSHIP_ESSAY.promptText,
    LEADERSHIP_ESSAY.promptTitle,
    LEADERSHIP_ESSAY.draft,
    FULL_ANALYSIS as any,
    {
      currentScore: LEADERSHIP_ESSAY.nqi,
      initialScore: LEADERSHIP_ESSAY.initialNqi,
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

    // Analyze context utilization
    const analysis = analyzeContextUsage(response.message.content, FULL_ANALYSIS);
    console.log(`CONTEXT UTILIZATION ANALYSIS:`);
    console.log(`- References workshop items: ${analysis.referencesWorkshopItems ? '✅' : '❌'}`);
    console.log(`- Quotes student draft: ${analysis.quotesStudentDraft ? '✅' : '❌'}`);
    console.log(`- Uses voice fingerprint: ${analysis.usesVoiceFingerprint ? '✅' : '❌'}`);
    console.log(`- References quality anchors: ${analysis.referencesQualityAnchors ? '✅' : '❌'}`);
    console.log(`- Mentions anti-patterns: ${analysis.mentionsAntiPatterns ? '✅' : '❌'}`);
    console.log(`- Uses dimension insights: ${analysis.usesDimensionInsights ? '✅' : '❌'}`);
    console.log(`- Offers specific suggestions: ${analysis.offersSpecificSuggestions ? '✅' : '❌'}`);
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

function analyzeContextUsage(response: string, analysis: typeof FULL_ANALYSIS) {
  const lower = response.toLowerCase();

  // Check for workshop item quotes
  const quotesWorkshopItem1 = response.includes('I have always been passionate') || response.includes('always been passionate');
  const quotesWorkshopItem2 = response.includes('This experience taught me') || response.includes('channeling collective passion');
  const referencesWorkshopItems = quotesWorkshopItem1 || quotesWorkshopItem2;

  // Check for draft quotes (any substantial quote from draft)
  const quotesStudentDraft = response.includes('My voice shook') ||
                           response.includes('2,000 plastic bottles') ||
                           response.includes('water refill stations') ||
                           referencesWorkshopItems;

  // Check for voice fingerprint usage
  const usesVoiceFingerprint = lower.includes('formal') ||
                              lower.includes('earnest') ||
                              lower.includes('voice') ||
                              lower.includes('rhythm') ||
                              lower.includes('methodical');

  // Check for quality anchor celebration
  const referencesQualityAnchors = response.includes('My voice shook') &&
                                  (lower.includes('keep') || lower.includes('preserve') || lower.includes('this is'));

  // Check for anti-pattern mentions
  const mentionsAntiPatterns = lower.includes('generic') ||
                              lower.includes('typical') ||
                              lower.includes('every other essay') ||
                              lower.includes('formulaic') ||
                              lower.includes('throat-clearing');

  // Check for dimension insights
  const usesDimensionInsights = lower.includes('stakes') ||
                               lower.includes('tension') ||
                               lower.includes('opening') ||
                               lower.includes('hook') ||
                               lower.includes('conclusion');

  // Check for specific, actionable suggestions
  const offersSpecificSuggestions = (response.match(/["'][^"']{20,}["']/g) || []).length >= 2; // Has at least 2 quoted suggestions

  return {
    referencesWorkshopItems,
    quotesStudentDraft,
    usesVoiceFingerprint,
    referencesQualityAnchors,
    mentionsAntiPatterns,
    usesDimensionInsights,
    offersSpecificSuggestions,
  };
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('\n🧪 TESTING CONTEXT UTILIZATION\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ No ANTHROPIC_API_KEY found in environment');
    process.exit(1);
  }

  const results = [];

  // Test 1: General question - should use multiple context sources
  results.push(
    await runTest(
      "How can I make this stronger?",
      'Test 1: General Improvement - Should Use Workshop Items + Dimensions'
    )
  );

  // Test 2: Specific opening question - should reference workshop item #1
  results.push(
    await runTest(
      "Is my opening strong?",
      'Test 2: Opening Question - Should Use Workshop Item #1 (Generic Opening)'
    )
  );

  // Test 3: Conclusion question - should reference workshop item #2
  results.push(
    await runTest(
      "How should I end this essay?",
      'Test 3: Conclusion Question - Should Use Workshop Item #2 (Generic Conclusion)'
    )
  );

  // Test 4: Voice question - should use voice fingerprint
  results.push(
    await runTest(
      "Does this sound like me?",
      'Test 4: Voice Question - Should Use Voice Fingerprint'
    )
  );

  // Test 5: Stakes question - should use dimension + workshop item #3
  results.push(
    await runTest(
      "Why doesn't this feel exciting?",
      'Test 5: Stakes/Tension - Should Use Dimension + Workshop Item #3'
    )
  );

  // Save results
  const markdown = generateMarkdownReport(results);
  await fs.writeFile('CONTEXT_UTILIZATION_TEST_RESULTS.md', markdown);

  console.log('\n✅ All tests complete!');
  console.log('📄 Results saved to: CONTEXT_UTILIZATION_TEST_RESULTS.md\n');

  // Summary
  const totalChecks = results.reduce((sum, r) => {
    if (!r.analysis) return sum;
    return sum + Object.values(r.analysis).filter(Boolean).length;
  }, 0);
  const maxChecks = results.filter(r => r.analysis).length * 7; // 7 checks per test

  console.log(`\n📊 OVERALL CONTEXT UTILIZATION: ${totalChecks}/${maxChecks} checks passed (${((totalChecks/maxChecks)*100).toFixed(0)}%)\n`);
}

function generateMarkdownReport(results: any[]) {
  let md = `# Context Utilization Test Results\n\n`;
  md += `**Test Date**: ${new Date().toISOString()}\n`;
  md += `**Purpose**: Verify AI coach uses all analysis context (workshop items, dimensions, fingerprints)\n\n`;
  md += `---\n\n`;

  results.forEach((result, idx) => {
    md += `## ${result.testName}\n\n`;
    md += `**Student Question**: "${result.question}"\n\n`;
    md += `**AI Coach Response**:\n${result.response}\n\n`;

    if (result.analysis) {
      md += `**✅ Context Utilization**:\n`;
      md += `- ${result.analysis.referencesWorkshopItems ? '✅' : '❌'} References workshop items (quotes identified problems)\n`;
      md += `- ${result.analysis.quotesStudentDraft ? '✅' : '❌'} Quotes student draft directly\n`;
      md += `- ${result.analysis.usesVoiceFingerprint ? '✅' : '❌'} Uses voice fingerprint data\n`;
      md += `- ${result.analysis.referencesQualityAnchors ? '✅' : '❌'} References quality anchors (sentences to keep)\n`;
      md += `- ${result.analysis.mentionsAntiPatterns ? '✅' : '❌'} Mentions anti-patterns or generic language\n`;
      md += `- ${result.analysis.usesDimensionInsights ? '✅' : '❌'} Uses rubric dimension insights\n`;
      md += `- ${result.analysis.offersSpecificSuggestions ? '✅' : '❌'} Offers specific, concrete suggestions\n\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

// Run tests
runAllTests().catch(console.error);
