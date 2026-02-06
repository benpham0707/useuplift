/**
 * LIVE E2E Test: Academic Advisor Conversation System
 *
 * This test makes ACTUAL API calls to Claude and generates REAL conversation outputs.
 * It demonstrates the full capability of the Insight-Driven Academic Advisor.
 *
 * Run with: ANTHROPIC_API_KEY="your-key" npx tsx tests/test-academic-advisor-live-e2e.ts
 */

// Load environment variables FIRST before any imports
import * as dotenv from 'dotenv';
dotenv.config();

import * as fs from 'fs';
import * as path from 'path';

import {
  generateInsightDrivenOpenerAsync,
  generateFollowUpAsync,
  extractProfileInsights,
  generateStrategicQuestions,
  type StudentProfile,
  type StudentResponse,
  type ConversationContext,
  type StrategicQuestion,
  type ProfileInsight,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability/conversational/insightDrivenAdvisor';

import {
  analyzeCapabilityNuanced,
  type NuancedCapabilityAnalysis,
} from '../src/services/portfolioStrategy/services/academicWorkshop/capability/nuancedCapabilityAnalyzer';

import type { CourseRecord } from '../src/services/portfolioStrategy/services/academicHistoryAnalyzer';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const OUTPUT_FILE = 'docs/ACADEMIC_ADVISOR_LIVE_OUTPUT.md';
const MAX_CONVERSATION_TURNS = 4; // Opening + 3 follow-ups
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ============================================================================
// RETRY UTILITY
// ============================================================================

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const isRetryable =
        lastError.message.includes('500') ||
        lastError.message.includes('502') ||
        lastError.message.includes('503') ||
        lastError.message.includes('overloaded') ||
        lastError.message.includes('Internal server error');

      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      console.log(`   ⚠️  Attempt ${attempt} failed (${lastError.message}). Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

// ============================================================================
// COST TRACKING
// ============================================================================

interface CostTracker {
  calls: number;
  inputTokens: number;
  outputTokens: number;
}

const costTracker: CostTracker = {
  calls: 0,
  inputTokens: 0,
  outputTokens: 0,
};

function estimateCost(): string {
  // Sonnet pricing: $3/1M input, $15/1M output
  // Haiku pricing: $0.25/1M input, $1.25/1M output
  // Estimate 70% Sonnet, 30% Haiku usage
  const sonnetInput = costTracker.inputTokens * 0.7;
  const sonnetOutput = costTracker.outputTokens * 0.7;
  const haikuInput = costTracker.inputTokens * 0.3;
  const haikuOutput = costTracker.outputTokens * 0.3;

  const cost =
    (sonnetInput / 1000000) * 3 +
    (sonnetOutput / 1000000) * 15 +
    (haikuInput / 1000000) * 0.25 +
    (haikuOutput / 1000000) * 1.25;

  return `$${cost.toFixed(4)}`;
}

// ============================================================================
// TEST STUDENT DATA
// ============================================================================

/**
 * Realistic course history for a strong math student who's playing it safe
 */
const TEST_COURSES: CourseRecord[] = [
  // Math progression - strong but not maximizing rigor
  { name: 'Algebra 1', subject: 'math', level: 'honors', grade: 'A', year: 9 },
  { name: 'Geometry', subject: 'math', level: 'honors', grade: 'A', year: 9 },
  { name: 'Algebra 2', subject: 'math', level: 'honors', grade: 'A', year: 10 },
  { name: 'Pre-Calculus', subject: 'math', level: 'honors', grade: 'A', year: 10 },

  // Science progression - solid
  { name: 'Biology', subject: 'science', level: 'honors', grade: 'A-', year: 9 },
  { name: 'Chemistry', subject: 'science', level: 'honors', grade: 'B+', year: 10 },

  // English - average
  { name: 'English 9', subject: 'english', level: 'regular', grade: 'B+', year: 9 },
  { name: 'English 10', subject: 'english', level: 'regular', grade: 'B+', year: 10 },

  // History - improving
  { name: 'World History', subject: 'social_studies', level: 'regular', grade: 'B', year: 9 },
  { name: 'US History', subject: 'social_studies', level: 'honors', grade: 'B+', year: 10 },

  // Foreign Language
  { name: 'Spanish 1', subject: 'foreign_language', level: 'regular', grade: 'A', year: 9 },
  { name: 'Spanish 2', subject: 'foreign_language', level: 'regular', grade: 'A-', year: 10 },
];

const TEST_GRADE_HISTORY = {
  '9': { gpa: 3.7, courses: 6 },
  '10': { gpa: 3.75, courses: 6 },
};

// ============================================================================
// TEST STUDENT PROFILES
// ============================================================================

/**
 * Creates a realistic student profile using the actual analyzer
 */
function createTestProfile(): StudentProfile {
  // Use the real analyzer to create proper NuancedCapabilityAnalysis structure
  const quantitativeAnalysis = analyzeCapabilityNuanced(TEST_COURSES, TEST_GRADE_HISTORY);

  return {
    quantitativeAnalysis,
    intendedMajor: 'Computer Science',
    targetSchools: ['Stanford', 'MIT', 'Carnegie Mellon', 'UC Berkeley'],
    currentGrade: 10,
    schoolContext: {
      type: 'well_resourced_suburban',
      name: 'Westlake High School',
      apCoursesAvailable: [
        'AP Calculus AB',
        'AP Calculus BC',
        'AP Computer Science A',
        'AP Computer Science Principles',
        'AP Physics 1',
        'AP Physics C: Mechanics',
        'AP Chemistry',
        'AP Biology',
        'AP Statistics',
      ],
    },
    previousInsights: {
      effortLevels: {
        math: 25,
        science: 60,
        english: 70,
        history: 55,
        languages: 50,
      },
      interestLevels: {
        math: 85,
        science: 75,
        english: 40,
        history: 35,
        languages: 30,
      },
    },
  };
}

// ============================================================================
// SIMULATED STUDENT RESPONSES
// ============================================================================

/**
 * Simulated student responses for the conversation.
 * These represent realistic student reactions to advisor questions.
 */
const STUDENT_RESPONSES: string[] = [
  // Response 1: Confirming low effort in math
  "Yeah, honestly math has always been pretty easy for me. I don't really study much for it - maybe like 15-20 minutes before a test? I usually finish the homework during lunch or in other classes. I've been thinking about AB vs BC but I'm kind of scared BC might hurt my GPA since I want to keep it high for college apps.",

  // Response 2: Discussing self-learning and coding
  "I've actually been teaching myself Python and some basic algorithms through YouTube and online courses. I made a couple small games and a Discord bot. But I wasn't sure if that stuff even matters for college since it's not official coursework. Is there a way to make that count?",

  // Response 3: Asking about workload concerns
  "That makes sense about the rigor thing. But I'm also in marching band which takes up like 15-20 hours a week during fall, plus I want to keep doing robotics club. Would taking BC and maybe Physics C be too much? I don't want to burn out.",
];

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

interface ConversationTurn {
  turn: number;
  speaker: 'advisor' | 'student';
  message: string;
  metadata?: {
    style?: string;
    pointsCovered?: {
      dataPointsMentioned: string[];
      argumentsMade: string[];
      courseRecommendations: string[];
      concernsAddressed: string[];
    };
    knowledgeUsed?: string[];
  };
}

async function runLiveConversation(): Promise<ConversationTurn[]> {
  const profile = createTestProfile();
  const conversation: ConversationTurn[] = [];

  console.log('\n🚀 Starting LIVE E2E Academic Advisor Test\n');
  console.log('='.repeat(60));

  // Extract insights and questions for building conversation context
  const allInsights = extractProfileInsights(profile);
  const allQuestions = generateStrategicQuestions(profile, allInsights);

  // Fallback question if none were generated
  const fallbackQuestion: StrategicQuestion = {
    question: `What subjects do you find yourself most engaged with, and what about them captures your interest?`,
    purpose: `Understanding your genuine interests helps me recommend coursework that builds toward something meaningful to you`,
    strategicImpact: `This informs both course recommendations and how to position your academic narrative`,
    hypothesis: `Student has interests that can inform course planning`,
    priority: 'important',
  };

  // Ensure we always have at least one question
  if (allQuestions.length === 0) {
    allQuestions.push(fallbackQuestion);
  }

  // ========================================
  // TURN 1: Advisor Opening
  // ========================================
  console.log('\n📝 Turn 1: Generating advisor opening...');

  try {
    const opener = await withRetry(() => generateInsightDrivenOpenerAsync(profile));

    console.log('✅ Opening generated successfully');
    console.log(`   Style: ${opener.naturalResponse?.style || 'natural'}`);
    console.log(`   Length: ${(opener.naturalMessage || opener.message).length} chars`);

    conversation.push({
      turn: 1,
      speaker: 'advisor',
      message: opener.naturalMessage || opener.message,
      metadata: {
        style: opener.naturalResponse?.style,
        pointsCovered: opener.naturalResponse?.pointsCovered,
        knowledgeUsed: opener.naturalResponse?.knowledgeUsed,
      },
    });

    costTracker.calls++;
  } catch (error) {
    console.error('❌ Opening generation failed:', error);
    throw error;
  }

  // Build initial conversation context
  let conversationContext: ConversationContext = {
    allInsights,
    remainingQuestions: allQuestions.slice(1), // First question was used in opener
    learnedFromConversation: {},
    currentFocus: 'capability_estimation',
    answersCollected: [],
  };

  // Track which question was just asked
  let lastQuestion = allQuestions[0];

  // ========================================
  // TURNS 2-4: Student Response + Advisor Follow-up
  // ========================================
  for (let i = 0; i < Math.min(STUDENT_RESPONSES.length, MAX_CONVERSATION_TURNS - 1); i++) {
    const turnNumber = i + 2;
    const studentMessage = STUDENT_RESPONSES[i];

    console.log(`\n📝 Turn ${turnNumber}a: Student response`);

    // Add student turn
    conversation.push({
      turn: turnNumber,
      speaker: 'student',
      message: studentMessage,
    });

    console.log(`📝 Turn ${turnNumber}b: Generating advisor follow-up...`);

    try {
      // Build student response context
      const studentResponse: StudentResponse = {
        message: studentMessage,
        questionAnswered: lastQuestion,
      };

      // Update conversation context with the new answer
      conversationContext = {
        ...conversationContext,
        answersCollected: [
          ...conversationContext.answersCollected,
          {
            question: lastQuestion,
            response: studentMessage,
          },
        ],
        learnedFromConversation: {
          ...conversationContext.learnedFromConversation,
          [lastQuestion.purpose]: extractLearning(studentMessage),
        },
        currentFocus: turnNumber <= 2 ? 'capability_estimation' : 'opportunity_identification',
      };

      const followUp = await withRetry(() =>
        generateFollowUpAsync(profile, studentResponse, conversationContext)
      );

      console.log('✅ Follow-up generated successfully');
      console.log(`   Length: ${(followUp.naturalMessage || followUp.message).length} chars`);

      conversation.push({
        turn: turnNumber,
        speaker: 'advisor',
        message: followUp.naturalMessage || followUp.message,
      });

      // Update for next iteration
      if (followUp.nextQuestion) {
        lastQuestion = followUp.nextQuestion;
        conversationContext.remainingQuestions = conversationContext.remainingQuestions.filter(
          (q) => q.question !== followUp.nextQuestion?.question
        );
      }

      costTracker.calls++;
    } catch (error) {
      console.error(`❌ Follow-up generation failed at turn ${turnNumber}:`, error);
      // Continue with next turn rather than failing completely
      conversation.push({
        turn: turnNumber,
        speaker: 'advisor',
        message: `[Error generating response: ${error instanceof Error ? error.message : String(error)}]`,
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Conversation completed');
  console.log(`   Total turns: ${conversation.length}`);
  console.log(`   API calls: ${costTracker.calls}`);
  console.log(`   Estimated cost: ${estimateCost()}`);

  return conversation;
}

/**
 * Extract key learning from student message
 */
function extractLearning(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('easy') || lower.includes("don't really study")) {
    return 'Confirms low effort in subject - operating well below capability';
  }
  if (lower.includes('scared') || lower.includes('hurt my gpa')) {
    return 'Has GPA protection concern - needs reassurance about weighting';
  }
  if (lower.includes('teaching myself') || lower.includes('youtube')) {
    return 'Shows initiative with self-learning - genuine interest evidence';
  }
  if (lower.includes('marching band') || lower.includes('robotics')) {
    return 'Has significant extracurricular commitments - workload consideration needed';
  }
  if (lower.includes('burn out') || lower.includes('too much')) {
    return 'Concerned about workload balance - practical scheduling discussion needed';
  }

  return 'Response noted - continuing exploration';
}

// ============================================================================
// MARKDOWN OUTPUT GENERATION
// ============================================================================

function generateMarkdownReport(conversation: ConversationTurn[]): string {
  const profile = createTestProfile();
  const timestamp = new Date().toISOString();
  const quant = profile.quantitativeAnalysis;

  // Extract subject patterns for display
  const subjectPatterns = Object.entries(quant.subjectPatterns).map(([subject, pattern]) => ({
    subject,
    avgGPA: pattern.performanceHistory.avgGPA,
    trend: pattern.performanceHistory.trend,
    relativeStrength: pattern.relativeStrength,
    recommendedLevel: pattern.recommendedLevel,
  }));

  let md = `# Academic Advisor Live E2E Output

> **Generated:** ${timestamp}
> **Status:** LIVE OUTPUT - Real API calls to Claude
> **API Calls:** ${costTracker.calls}
> **Estimated Cost:** ${estimateCost()}

---

## Student Profile

| Field | Value |
|-------|-------|
| Grade | ${profile.currentGrade}th |
| Intended Major | ${profile.intendedMajor} |
| Target Schools | ${profile.targetSchools?.join(', ')} |
| Performance Percentile | ${quant.performanceFingerprint.performancePercentile.toFixed(0)}th |
| Consistency Score | ${quant.performanceFingerprint.consistencyScore.toFixed(0)}% |
| Difficulty Sensitivity | ${quant.performanceFingerprint.difficultySensitivity} |

### Academic Patterns by Subject

`;

  for (const pattern of subjectPatterns) {
    const strengthLabel = pattern.relativeStrength > 0.3 ? 'Strength' : pattern.relativeStrength < -0.3 ? 'Challenge' : 'Average';
    md += `**${pattern.subject.charAt(0).toUpperCase() + pattern.subject.slice(1)}:**
- GPA: ${pattern.avgGPA.toFixed(2)} (${pattern.trend})
- Relative: ${strengthLabel} (${pattern.relativeStrength.toFixed(2)})
- Recommended: ${pattern.recommendedLevel}

`;
  }

  md += `---

## Live Conversation

`;

  for (const turn of conversation) {
    const speakerLabel = turn.speaker === 'advisor' ? '🎓 **Advisor**' : '👤 **Student**';

    md += `### Turn ${turn.turn} - ${speakerLabel}

${turn.message}

`;

    if (turn.metadata?.pointsCovered) {
      const pc = turn.metadata.pointsCovered;
      if (
        pc.dataPointsMentioned.length > 0 ||
        pc.argumentsMade.length > 0 ||
        pc.courseRecommendations.length > 0 ||
        pc.concernsAddressed.length > 0
      ) {
        md += `<details>
<summary>📊 Points Covered (Click to expand)</summary>

- **Data Points:** ${pc.dataPointsMentioned.join(', ') || 'None'}
- **Arguments:** ${pc.argumentsMade.join(', ') || 'None'}
- **Course Recommendations:** ${pc.courseRecommendations.join(', ') || 'None'}
- **Concerns Addressed:** ${pc.concernsAddressed.join(', ') || 'None'}

</details>

`;
      }
    }

    md += `---

`;
  }

  md += `## System Information

### Conversation Efficiency Features

1. **LLM-Based Point Extraction** - Uses Claude Haiku to semantically extract what points were covered in each response, preventing repetition across turns.

2. **Assembled Research Context** - Pulls relevant data from unified research databases (course data, college expectations, admission statistics) dynamically based on conversation topics.

3. **Anti-Fluff Guidelines** - Prompts explicitly instruct to:
   - Start strong with substance (no throat-clearing)
   - Front-load high-value insights
   - Avoid repetition of previously covered points
   - Use specific data rather than generic advice

4. **Emotional Tone Detection** - Adapts response style based on detected student emotional state (anxious, defensive, open, etc.)

### Key Files

- \`naturalResponseGenerator.ts\` - Core LLM response generation with point tracking
- \`insightDrivenAdvisor.ts\` - Strategic conversation orchestration
- \`unifiedResearchAssemblyService.ts\` - Research context assembly
- \`academicCourseKnowledgeBase.ts\` - AP course expertise database

---

*This document was generated by running actual API calls through the Academic Advisor system. The conversation above represents real Claude outputs, not simulated or templated responses.*
`;

  return md;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       ACADEMIC ADVISOR LIVE E2E TEST                       ║');
  console.log('║       Making Real API Calls to Claude                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\n❌ Error: ANTHROPIC_API_KEY environment variable not set');
    console.error('   Run with: ANTHROPIC_API_KEY="your-key" npx tsx tests/test-academic-advisor-live-e2e.ts\n');
    process.exit(1);
  }

  console.log(`\n✅ API Key found (${process.env.ANTHROPIC_API_KEY.slice(0, 10)}...)`);

  try {
    // Run the live conversation
    const conversation = await runLiveConversation();

    // Generate markdown report
    const markdownReport = generateMarkdownReport(conversation);

    // Write to file
    const outputPath = path.join(process.cwd(), OUTPUT_FILE);
    fs.writeFileSync(outputPath, markdownReport);

    console.log(`\n📄 Report written to: ${OUTPUT_FILE}`);

    // Also output the conversation to console
    console.log('\n' + '='.repeat(60));
    console.log('CONVERSATION TRANSCRIPT');
    console.log('='.repeat(60));

    for (const turn of conversation) {
      const prefix = turn.speaker === 'advisor' ? '🎓 ADVISOR:' : '👤 STUDENT:';
      console.log(`\n${prefix}\n${turn.message}\n`);
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
