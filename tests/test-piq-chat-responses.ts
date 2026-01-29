/**
 * Test PIQ Chat Responses
 *
 * Tests the refined conversational system prompt with real essays
 * to validate tone, quality, and helpfulness.
 */

import 'dotenv/config';
import { buildPIQChatContext } from './src/services/piqWorkshop/piqChatContext';
import { sendPIQChatMessage } from './src/services/piqWorkshop/piqChatService';
import fs from 'fs/promises';

// ============================================================================
// TEST ESSAYS
// ============================================================================

const STRONG_ESSAY = {
  promptId: 'piq1',
  promptTitle: 'Leadership Experience',
  promptText: 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.',
  draft: `Most Wednesdays smelled like bleach and citrus. I learned which regulars wanted to talk and which just needed silence while I checked them in. Started as a greeter, but three months in, I noticed patients struggling with our intake form—some couldn't read English well, others seemed overwhelmed by medical jargon. I redesigned the form with my supervisor Ana, cutting questions from 47 to 22 and adding simple icons. Wait times dropped from 18 minutes to 9, and patients started asking follow-up questions instead of just nodding. By spring, I was training two freshmen to run intake so the system wouldn't collapse when I graduated. I used to think efficiency meant speed, but I learned it actually means removing the barriers that make people feel small. That insight changed how I approach every group project now—I pause and ask what we're missing, not just what we need to do faster.`,
  nqi: 88,
  initialNqi: 73,
};

const POETIC_VAGUE_ESSAY = {
  promptId: 'piq5',
  promptTitle: 'Meaningful Environment',
  promptText: 'Describe the most significant challenge you have faced and the steps you have taken to overcome this challenge. How has this challenge affected your academic achievement?',
  draft: `The soil breathes. I can feel it under my fingernails, dark and rich and heavy with the promise of August tomatoes. My grandfather always said that patience is a color, and in his garden, it was the green of slow-climbing vines. I spent my summers there, lost in the humidity and the buzzing of cicadas, watching him work with hands that looked like tree bark.

I remember the day the drought came. The sky turned a pale, sick white. The leaves curled up like burning paper. I was afraid. I didn't know what to do. I just watched the green fade to brown. My grandfather didn't say anything. He just carried buckets. Back and forth. From the creek to the garden.

I think that's when I learned about resilience. It's not a big loud thing. It's just carrying buckets. I try to bring that to my schoolwork now. When calculus feels like a drought, I just carry buckets. When the debate team loses, I carry buckets. It's a metaphor, I know, but it feels real to me. The soil remembers the water you give it.`,
  nqi: 65,
  initialNqi: 58,
};

const TYPICAL_ARC_ESSAY = {
  promptId: 'piq1',
  promptTitle: 'Leadership Experience',
  promptText: 'Describe an example of your leadership experience in which you have positively influenced others, helped resolve disputes or contributed to group efforts over time.',
  draft: `It hurt to cap off a rough junior year football campaign with a losing record of 1-9 knowing the amount of people we disappointed. Walking around school with the title of captain of the football team possessed little to no value and was merely an embarrassment. The irritation of peers constantly remarking, "Why are you guys so bad?" lingered in my mind since the end of that season.

With this goal in mind, I understood that the beginning to a winning season would require the individual efforts of every player on the team. Thus, I made sure the schedule of every teammate during the off-season consisted of captain-led weight-room practices, conditioning, and field work. Over the course of the off-season, good days were stacked with better days and great days were topped by our best days.

Nearing the beginning of my senior year, team morale elevated. As time until the kickoff came to an end, I could not help but to take a moment to acknowledge my blood, sweat, and tears with this team. I have learned to lead more effectively than I have before to prepare us for this rewarding season. I anticipated my ameliorated team to dominate the entire game, and as it played out, my expectations were exceeded with a win of 52-14. I was glad the training during the off-season, all the drills I had led, translated to our accomplishments on the field and the values we will possess in the future.`,
  nqi: 58,
  initialNqi: 52,
};

// ============================================================================
// MOCK ANALYSIS RESULTS
// ============================================================================

function createMockAnalysis(essay: typeof STRONG_ESSAY) {
  const isStrong = essay.nqi >= 85;
  const isPoetic = essay.draft.includes('soil breathes');
  const isTypical = essay.draft.includes('football');

  return {
    analysis: {
      narrative_quality_index: essay.nqi,
    },
    voiceFingerprint: isPoetic
      ? {
          sentenceStructure: {
            pattern: 'Lyrical with varied rhythms - mixes very short fragments with flowing complex sentences',
            example: 'The soil breathes.',
          },
          vocabulary: {
            level: 'Poetic with sensory richness',
            signatureWords: ['breathes', 'cicadas', 'humidity', 'drought'],
          },
          pacing: {
            speed: 'Measured',
            rhythm: 'Flowing with intentional pauses',
          },
          tone: {
            primary: 'Contemplative',
            secondary: 'Nostalgic',
          },
        }
      : isStrong
      ? {
          sentenceStructure: {
            pattern: 'Varied - mixes short punchy with complex',
            example: 'Most Wednesdays smelled like bleach and citrus.',
          },
          vocabulary: {
            level: 'Conversational with technical precision',
            signatureWords: ['noticed', 'redesigned', 'efficiency', 'barriers'],
          },
          pacing: {
            speed: 'Quick',
            rhythm: 'Staccato with momentum',
          },
          tone: {
            primary: 'Reflective',
            secondary: 'Determined',
          },
        }
      : {
          sentenceStructure: {
            pattern: 'Formal essay structure - mostly complex compound sentences',
            example: 'It hurt to cap off a rough junior year football campaign with a losing record of 1-9.',
          },
          vocabulary: {
            level: 'Formal with some clichés',
            signatureWords: ['ameliorated', 'possessed', 'lingered'],
          },
          pacing: {
            speed: 'Deliberate',
            rhythm: 'Even, methodical',
          },
          tone: {
            primary: 'Earnest',
            secondary: 'Reflective',
          },
        },
    experienceFingerprint: isPoetic
      ? {
          uniqueElements: {
            specificSensoryAnchor: {
              sensory: 'Soil, humidity, cicadas',
              context: "Grandfather's garden during drought",
              emotionalWeight: 'Nostalgia and resilience',
            },
          },
          antiPatternFlags: {
            followsTypicalArc: false,
            hasGenericInsight: true, // "resilience is carrying buckets" is metaphorical but vague
            hasManufacturedBeat: false,
            hasCrowdPleaser: false,
            warnings: ['Essay uses extended metaphor but lacks concrete action/transformation'],
          },
          divergenceRequirements: {
            mustInclude: ['Specific conversation with grandfather', 'Concrete lesson learned through action'],
            mustAvoid: ['More metaphorical language without grounding'],
            uniqueAngle: 'Sensory-rich memory + resilience through mundane action',
            authenticTension: 'Drought as challenge, carrying water as solution',
          },
          qualityAnchors: [
            {
              sentence: 'The soil breathes.',
              whyItWorks: 'Arresting opening, poetic but grounded',
              preservationPriority: 'critical' as const,
            },
            {
              sentence: 'My grandfather didn\'t say anything. He just carried buckets.',
              whyItWorks: 'Shows through action, not telling',
              preservationPriority: 'high' as const,
            },
          ],
          confidenceScore: 7.2,
        }
      : isStrong
      ? {
          uniqueElements: {
            specificSensoryAnchor: {
              sensory: 'Bleach and citrus smell',
              context: 'Wednesday clinic check-ins',
              emotionalWeight: 'Routine familiarity',
            },
            contraryInsight: {
              insight: 'Efficiency means removing barriers, not speed',
              againstWhat: 'Common assumption that efficiency = faster',
              whyAuthentic: 'Learned through redesigning intake forms',
            },
          },
          antiPatternFlags: {
            followsTypicalArc: false,
            hasGenericInsight: false,
            hasManufacturedBeat: false,
            hasCrowdPleaser: false,
            warnings: [],
          },
          divergenceRequirements: {
            mustInclude: [],
            mustAvoid: [],
            uniqueAngle: 'Efficiency redefined through removing barriers for vulnerable populations',
            authenticTension: 'Systemic problem (bad form) vs. individual solution (redesign)',
          },
          qualityAnchors: [
            {
              sentence: 'Most Wednesdays smelled like bleach and citrus.',
              whyItWorks: 'Specific, sensory, grounds reader in setting',
              preservationPriority: 'critical' as const,
            },
            {
              sentence: 'I used to think efficiency meant speed, but I learned it actually means removing the barriers that make people feel small.',
              whyItWorks: 'Clear transformation from concrete experience',
              preservationPriority: 'high' as const,
            },
          ],
          confidenceScore: 9.1,
        }
      : {
          uniqueElements: {},
          antiPatternFlags: {
            followsTypicalArc: true,
            hasGenericInsight: true,
            hasManufacturedBeat: false,
            hasCrowdPleaser: false,
            warnings: [
              'Essay follows typical challenge→overcome→growth arc',
              'Generic lessons: "I learned to lead more effectively"',
            ],
          },
          divergenceRequirements: {
            mustInclude: ['Specific training moment', 'Dialogue with teammate', 'Unique leadership approach'],
            mustAvoid: ['Generic sports clichés', '"blood, sweat, and tears" phrases'],
            uniqueAngle: 'Rebuilding team culture after public embarrassment',
            authenticTension: 'Personal embarrassment vs. team rebuilding',
          },
          qualityAnchors: [],
          confidenceScore: 4.3,
        },
    rubricDimensionDetails: [],
    workshopItems: [],
  };
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

async function runTest(
  essay: typeof STRONG_ESSAY,
  question: string,
  testName: string
) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${testName}`);
  console.log(`${'='.repeat(80)}\n`);

  const analysisResult = createMockAnalysis(essay) as any;

  const context = buildPIQChatContext(
    essay.promptId,
    essay.promptText,
    essay.promptTitle,
    essay.draft,
    analysisResult,
    {
      currentScore: essay.nqi,
      initialScore: essay.initialNqi,
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

    return {
      testName,
      essay: essay.promptTitle,
      nqi: essay.nqi,
      question,
      response: response.message.content,
    };
  } catch (error) {
    console.error(`❌ Test failed:`, error);
    return {
      testName,
      essay: essay.promptTitle,
      nqi: essay.nqi,
      question,
      response: `ERROR: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  console.log('\n🧪 TESTING PIQ CHAT RESPONSES (Refined Conversational Tone)\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ No ANTHROPIC_API_KEY found in environment');
    process.exit(1);
  }

  const results = [];

  // Test 1: Strong essay - celebrate quality
  results.push(
    await runTest(
      STRONG_ESSAY,
      "What's working well in my essay?",
      'Test 1: Strong Essay - Celebrate Quality'
    )
  );

  // Test 2: Strong essay - nitpick request
  results.push(
    await runTest(
      STRONG_ESSAY,
      'How can I make this even better? Be harsh.',
      'Test 2: Strong Essay - Nitpick'
    )
  );

  // Test 3: Poetic vague - needs more story
  results.push(
    await runTest(
      POETIC_VAGUE_ESSAY,
      'Why is my score not higher? I worked really hard on this.',
      'Test 3: Poetic Essay - Score Question'
    )
  );

  // Test 4: Poetic vague - how to improve
  results.push(
    await runTest(
      POETIC_VAGUE_ESSAY,
      'What should I focus on first?',
      'Test 4: Poetic Essay - Improvement Priority'
    )
  );

  // Test 5: Typical arc - generic pattern
  results.push(
    await runTest(
      TYPICAL_ARC_ESSAY,
      "I'm not sure what's wrong with this. Can you help?",
      'Test 5: Football Essay - Generic Pattern'
    )
  );

  // Test 6: Typical arc - stuck on revision
  results.push(
    await runTest(
      TYPICAL_ARC_ESSAY,
      "I've revised this 3 times and the score barely changed. What am I missing?",
      'Test 6: Football Essay - Stuck'
    )
  );

  // Save results to file
  const markdown = generateMarkdownReport(results);
  await fs.writeFile('PIQ_CHAT_TEST_RESULTS.md', markdown);

  console.log('\n✅ All tests complete!');
  console.log('📄 Results saved to: PIQ_CHAT_TEST_RESULTS.md\n');
}

function generateMarkdownReport(results: any[]) {
  let md = `# PIQ Chat Response Test Results\n\n`;
  md += `**Test Date**: ${new Date().toISOString()}\n`;
  md += `**System Prompt**: Conversational, storytelling tone\n\n`;
  md += `---\n\n`;

  results.forEach((result, idx) => {
    md += `## ${result.testName}\n\n`;
    md += `**Essay**: ${result.essay} (NQI: ${result.nqi})\n\n`;
    md += `**Student Question**:\n> ${result.question}\n\n`;
    md += `**AI Coach Response**:\n${result.response}\n\n`;
    md += `---\n\n`;
  });

  return md;
}

// Run tests
runAllTests().catch(console.error);
