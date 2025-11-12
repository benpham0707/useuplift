/**
 * Comprehensive Chat System Tests
 *
 * Tests various scenarios to ensure chat responses are:
 * - Conversational and natural
 * - Specific and quote-based
 * - Detailed (200-400 words)
 * - Coaching-oriented, not report-like
 */

import Anthropic from '@anthropic-ai/sdk';

// API Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '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';

const client = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// System Prompt (from chatService.ts)
const SYSTEM_PROMPT = `You are a warm, insightful essay coach having a conversation with a student about their college application narrative. You're not generating reports or bullet points - you're having a genuine dialogue about their writing.

**Core Philosophy**:
- Tell stories, don't cite stats. When you reference their score or categories, weave it into a narrative about what's working and what could be stronger.
- Focus on ONE quality insight per response, then suggest other things you could explore together.
- Contextualize everything - never just say "your score is X" without explaining what that means for them.
- Use natural, conversational language like you're sitting across from them, not writing a formal evaluation.

**Your Approach**:
1. **Start with Understanding**: When they ask about their score or an issue, begin by acknowledging what you see in their writing and why it matters.

2. **Tell the Story**: Instead of listing problems, tell them what's happening in their narrative - "When you wrote about [specific moment], I can see you're trying to show [thing], but what comes through is [other thing]..."

3. **One Good Answer**: Give them ONE really thoughtful insight that helps them see their writing differently. Don't dump 5 issues at once.

4. **Then Suggest Options**: After your main insight, offer 2-3 OTHER things you could talk about - "Want to dig deeper into this section?" or "Should we talk about [related issue]?" or "I can walk you through some reflection questions if that would help."

5. **Use Their Words**: Quote specific phrases from their draft to ground your feedback in their actual writing.

6. **Plain Language**: When you mention technical categories like "specificity_evidence" or "transformative_impact", immediately translate to plain language - "which is really about [plain explanation]"

**Conversational Style**:
- Start responses naturally: "Let's talk about...", "I'm noticing...", "Here's what I see...", "Good question..."
- Use contractions and natural speech: "you're", "there's", "let's", "I'd"
- Ask questions back: "Want to explore that?", "Should we dig into this?", "What made this experience meaningful to you?"
- Show empathy: "I can see you're trying to...", "This is hard work...", "You're making progress..."

**What to Avoid**:
- Never start with "Here are 3 ways to improve..." - that's a report, not a conversation
- Don't list scores and gaps without context - integrate them into your narrative
- Don't overwhelm with all the problems - pick the most important one
- Don't sound robotic or formal - you're a human coach, not a scoring rubric
- Never rewrite their essay - guide them to their own insights

**Tone**: Mentor - Talk like a supportive mentor who genuinely cares about their growth, not an automated feedback system.`;

// Test Cases
const TEST_CASES = [
  {
    name: 'Low Score (15/100) - Generic Essay',
    context: {
      activity: 'Community Tutoring Platform',
      score: 15,
      draft: 'I started a tutoring platform to help students in my community. We helped over 100 students improve their grades. It was a rewarding experience that taught me leadership skills.',
      topIssue: 'Reflection Meaning: Needs Improvement',
    },
    userMessage: 'How do I fix "Reflection Meaning: Needs Improvement"?',
  },
  {
    name: 'Medium Score (55/100) - Has Story, Lacks Depth',
    context: {
      activity: 'Debate Team Captain',
      score: 55,
      draft: 'As debate captain, I led our team to state championships. I spent countless hours preparing cases and coaching younger members. The pressure was intense, especially before the final round where we faced the defending champions.',
      topIssue: 'Voice Integrity: Manufactured Phrases',
    },
    userMessage: 'Why is my voice integrity score low?',
  },
  {
    name: 'Good Score (72/100) - Strong Foundation',
    context: {
      activity: 'Environmental Research Project',
      score: 72,
      draft: 'When I discovered the stream behind my school was contaminated, I couldn\'t sleep. I spent three months testing water samples, documenting pollution sources, and presenting findings to the city council. The moment they approved our restoration plan, I realized environmental science wasn\'t just a subject - it was my calling.',
      topIssue: 'Craft Language Quality: Passive Voice',
    },
    userMessage: 'What should I focus on to get to 80+?',
  },
  {
    name: 'Score Question - General',
    context: {
      activity: 'Youth Orchestra Conductor',
      score: 48,
      draft: 'I conducted the youth orchestra for two years. We performed at various community events and helped younger students learn music. I learned about leadership and the importance of practice.',
      topIssue: 'Specificity Evidence: Vague Language',
    },
    userMessage: 'Why is my score so low? What\'s wrong with my essay?',
  },
  {
    name: 'High Score (85/100) - Excellence',
    context: {
      activity: 'Food Justice Advocacy',
      score: 85,
      draft: 'The first time I saw Ms. Johnson choose between rent and groceries, something cracked open in me. Not pity - anger. How was this a choice anyone should make? I spent the next year turning that anger into action: organizing food drives, lobbying for policy change, building a network of 15 community partners. But the real work wasn\'t the logistics - it was learning to listen.',
      topIssue: 'Minor: Sentence variety could be stronger',
    },
    userMessage: 'How can I make this even better?',
  },
  {
    name: 'Progress Question',
    context: {
      activity: 'Robotics Team',
      score: 67,
      previousScore: 52,
      draft: 'Our robot failed spectacularly at regionals - wiring shorting out mid-match, wheels grinding to a halt. But in that failure, I found my engineering philosophy: test early, fail small, iterate constantly. By nationals, we weren\'t just competing - we were teaching other teams our debugging process.',
      topIssue: 'None - good progress',
    },
    userMessage: 'I improved from 52 to 67! What did I do right?',
  },
];

// Helper to format context
function formatContext(context) {
  let formatted = `# STUDENT CONTEXT

**Activity**: ${context.activity}
**Current NQI Score**: ${context.score}/100
**Status**: ${context.score >= 80 ? 'Excellent' : context.score >= 70 ? 'Strong' : context.score >= 60 ? 'Solid' : context.score >= 40 ? 'Developing' : 'Needs Work'}

**Current Draft**:
"${context.draft}"

**Top Issue**: ${context.topIssue}
${context.previousScore ? `**Previous Score**: ${context.previousScore}/100 (improved by +${context.score - context.previousScore})` : ''}

`;
  return formatted;
}

// Run test
async function runTest(testCase) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log(`Score: ${testCase.context.score}/100`);
  console.log(`Question: "${testCase.userMessage}"`);
  console.log(`${'='.repeat(80)}\n`);

  const contextBlock = formatContext(testCase.context);
  const fullPrompt = `${contextBlock}

# STUDENT QUESTION
${testCase.userMessage}

# YOUR TASK
Have a natural, flowing conversation. Your response should:
1. Start conversationally - "Let me walk you through..." or "Here's what I see..." (NO formal intros)
2. Quote their actual draft text to ground feedback in their words
3. Tell a story about what's working and what isn't - don't list bullet points
4. Give ONE really good insight, then suggest 2-3 other directions to explore
5. Use contractions, ask questions, show empathy - you're a real coach, not a bot
6. Aim for 4-6 paragraphs of natural conversation (200-400 words)
7. End by offering to explore something specific or asking what they want to focus on

REMEMBER: You're having a conversation, not writing a report. Be warm, specific, and helpful.`;

  try {
    const startTime = Date.now();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.8,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
    });

    const duration = Date.now() - startTime;
    const content = response.content[0].text;
    const wordCount = content.split(/\s+/).length;
    const paragraphCount = content.split(/\n\n/).filter(p => p.trim().length > 0).length;

    console.log('✓ RESPONSE RECEIVED');
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`);
    console.log(`  Cost: $${(response.usage.input_tokens * 0.000003 + response.usage.output_tokens * 0.000015).toFixed(4)}`);
    console.log(`  Word Count: ${wordCount} words`);
    console.log(`  Paragraphs: ${paragraphCount}`);
    console.log('\n--- RESPONSE ---\n');
    console.log(content);
    console.log('\n--- ANALYSIS ---');

    // Quality checks
    const hasQuotes = content.includes('"') || content.includes('"') || content.includes('"');
    const hasContractions = /\b(you're|I'm|let's|there's|it's|don't|can't|won't)\b/i.test(content);
    const hasQuestion = content.includes('?');
    const startsConversationally = /^(Let me|Here's|I'm|Good question|So|Okay|Alright|You know what)/i.test(content);
    const hasBulletPoints = /^[-•*]\s/m.test(content) || /^\d+\.\s/m.test(content);

    console.log(`  ✓ Quotes draft: ${hasQuotes ? '✓ YES' : '✗ NO'}`);
    console.log(`  ✓ Uses contractions: ${hasContractions ? '✓ YES' : '✗ NO'}`);
    console.log(`  ✓ Asks questions: ${hasQuestion ? '✓ YES' : '✗ NO'}`);
    console.log(`  ✓ Conversational start: ${startsConversationally ? '✓ YES' : '✗ NO'}`);
    console.log(`  ✓ No bullet points: ${!hasBulletPoints ? '✓ YES' : '✗ HAS BULLETS'}`);
    console.log(`  ✓ Length: ${wordCount >= 200 && wordCount <= 500 ? '✓ GOOD (200-500)' : wordCount < 200 ? '✗ TOO SHORT' : '⚠ LONG'}`);

    const qualityScore = [hasQuotes, hasContractions, hasQuestion, startsConversationally, !hasBulletPoints].filter(Boolean).length;
    console.log(`  Overall Quality: ${qualityScore}/5 ${qualityScore >= 4 ? '✓ EXCELLENT' : qualityScore >= 3 ? '✓ GOOD' : '⚠ NEEDS WORK'}`);

    return {
      success: true,
      testCase: testCase.name,
      wordCount,
      paragraphCount,
      qualityScore,
      response: content,
    };

  } catch (error) {
    console.error('✗ ERROR:', error.message);
    return {
      success: false,
      testCase: testCase.name,
      error: error.message,
    };
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    COMPREHENSIVE CHAT SYSTEM TESTS                         ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  const results = [];

  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);

    // Wait 1 second between tests to avoid rate limiting
    if (TEST_CASES.indexOf(testCase) < TEST_CASES.length - 1) {
      console.log('\n⏳ Waiting 1s before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              TEST SUMMARY                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Total Tests: ${results.length}`);
  console.log(`✓ Passed: ${successful.length}`);
  console.log(`✗ Failed: ${failed.length}\n`);

  if (successful.length > 0) {
    const avgWordCount = successful.reduce((sum, r) => sum + r.wordCount, 0) / successful.length;
    const avgQuality = successful.reduce((sum, r) => sum + r.qualityScore, 0) / successful.length;

    console.log('Quality Metrics:');
    console.log(`  Average Word Count: ${Math.round(avgWordCount)} words`);
    console.log(`  Average Quality Score: ${avgQuality.toFixed(1)}/5`);
    console.log(`  High Quality Responses (4+/5): ${successful.filter(r => r.qualityScore >= 4).length}/${successful.length}`);
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    failed.forEach(r => console.log(`  - ${r.testCase}: ${r.error}`));
  }

  console.log('\n✅ All tests completed!\n');
}

// Run tests
runAllTests().catch(console.error);
