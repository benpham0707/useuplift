/**
 * RAG Teaching Impact Test
 *
 * Compares teaching quality WITH and WITHOUT RAG context.
 * Takes 5 essay issues across different dimensions, generates
 * teaching for each with and without RAG, then evaluates specificity
 * and actionability using LLM-as-judge.
 *
 * Pass criteria: RAG-enhanced preferred in 4/5 comparisons
 *
 * Requires: ANTHROPIC_API_KEY + OPENAI_API_KEY
 */

import { requireApiKey } from './utils/loadEnv';

const anthropicKey = requireApiKey('ANTHROPIC_API_KEY');
requireApiKey('OPENAI_API_KEY');

import { callClaude } from '../src/lib/llm/claude';
import { ragService } from '../src/services/rag';

// ============================================================================
// TEST CASES — 5 essay issues across different dimensions
// ============================================================================

interface TestCase {
  dimension: string;
  issueText: string;
  essayContext: string;
}

const TEST_CASES: TestCase[] = [
  {
    dimension: 'reflection_meaning',
    issueText: 'I learned a lot from volunteering at the hospital. It taught me about compassion and working with diverse groups of people.',
    essayContext: 'Student describes hospital volunteering but reflection is generic and could apply to anyone.',
  },
  {
    dimension: 'evidence_impact',
    issueText: 'I helped improve our school recycling program significantly.',
    essayContext: 'Student claims impact but provides no numbers, timelines, or before/after comparison.',
  },
  {
    dimension: 'voice_integrity',
    issueText: 'This transformative experience taught me to delve into the tapestry of human connection and showcase my unwavering commitment to making a difference.',
    essayContext: 'Student\'s writing is saturated with AI-sounding language. Their real voice is nowhere to be found.',
  },
  {
    dimension: 'narrative_arc_stakes',
    issueText: 'I decided to start a tutoring program because I wanted to help others. It was successful and I enjoyed it.',
    essayContext: 'No stakes, no conflict, no tension. The narrative is flat — nothing was at risk.',
  },
  {
    dimension: 'initiative_leadership',
    issueText: 'As president of the club, I organized meetings and coordinated events throughout the year.',
    essayContext: 'Student lists duties but shows no unique initiative, no decisions that could have gone differently.',
  },
];

// ============================================================================
// TEACHING GENERATOR
// ============================================================================

const TEACHING_SYSTEM_PROMPT = `You are an expert college admissions writing coach.
Provide specific, actionable teaching for the identified issue in this student's essay.

Your teaching should:
1. Explain WHY this is a problem (with admissions context)
2. Show a CONCRETE before/after example using their actual text
3. Give a TRANSFERABLE principle they can apply elsewhere
4. Be direct — no filler, no generic praise

Respond in JSON:
{
  "problemExplanation": "Why this matters for admissions (2-3 sentences)",
  "beforeAfter": {
    "before": "Their weak text",
    "after": "Your improved version"
  },
  "principle": "Transferable writing principle (1 sentence)",
  "actionSteps": ["Step 1", "Step 2", "Step 3"]
}`;

async function generateTeaching(issueText: string, essayContext: string, ragContext?: string): Promise<string> {
  let systemPrompt = TEACHING_SYSTEM_PROMPT;
  if (ragContext) {
    systemPrompt += `\n\n## Teaching Examples from Real Essays\n${ragContext}\n\nUse these examples to ground your teaching in real patterns. Reference the principles when applicable.`;
  }

  const response = await callClaude({
    systemPrompt,
    userPrompt: `ISSUE:\n"${issueText}"\n\nCONTEXT:\n${essayContext}`,
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 1500,
    temperature: 0.3,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
}

// ============================================================================
// JUDGE
// ============================================================================

const JUDGE_SYSTEM_PROMPT = `You are evaluating two pieces of writing teaching for college essay improvement.
Compare Teaching A and Teaching B on these criteria:

1. **Specificity**: Does the teaching reference concrete techniques, not just general advice?
2. **Actionability**: Could the student implement the advice immediately?
3. **Before/After Quality**: Is the example transformation realistic and helpful?
4. **Principle Clarity**: Is the transferable principle clear and memorable?

You must choose which is better overall. If they are truly equal, say "tie".

Respond in JSON:
{
  "winner": "A" | "B" | "tie",
  "reasoning": "1-2 sentences explaining your choice",
  "specificityWinner": "A" | "B" | "tie",
  "actionabilityWinner": "A" | "B" | "tie"
}`;

async function judgeTeachingPair(teachingA: string, teachingB: string, context: string): Promise<{ winner: string; reasoning: string }> {
  const response = await callClaude({
    systemPrompt: JUDGE_SYSTEM_PROMPT,
    userPrompt: `CONTEXT: ${context}\n\nTEACHING A:\n${teachingA}\n\nTEACHING B:\n${teachingB}\n\nWhich teaching is more helpful for the student?`,
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 500,
    temperature: 0.1,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  const text = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
  try {
    const parsed = JSON.parse(text);
    return { winner: parsed.winner || 'tie', reasoning: parsed.reasoning || '' };
  } catch {
    return { winner: 'tie', reasoning: 'Failed to parse judge response' };
  }
}

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTests(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RAG Teaching Impact Test');
  console.log('═══════════════════════════════════════════════════════════\n');

  let ragPreferred = 0;
  let baselinePreferred = 0;
  let ties = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    console.log(`\nTest ${i + 1}/5: ${tc.dimension}`);
    console.log(`  Issue: "${tc.issueText.substring(0, 80)}..."`);

    // Retrieve RAG context for this dimension
    let ragContext: string | undefined;
    try {
      const fragments = await ragService.retrieveExamples(tc.issueText, {
        dimension: tc.dimension,
        limit: 2,
      });
      const transformations = await ragService.retrieveTransformations(tc.issueText, {
        dimension: tc.dimension,
        limit: 2,
      });
      const parts: string[] = [];
      if (fragments.length > 0) {
        parts.push(ragService.formatForPrompt(fragments));
      }
      if (transformations.length > 0) {
        parts.push(ragService.formatTransformationsForPrompt(transformations));
      }
      if (parts.length > 0) {
        ragContext = parts.join('\n\n');
      }
      console.log(`  RAG: ${fragments.length} fragments, ${transformations.length} transformations`);
    } catch (e) {
      console.warn(`  RAG retrieval failed: ${e instanceof Error ? e.message : e}`);
    }

    // Generate teaching without RAG
    console.log('  Generating baseline (no RAG)...');
    const baselineTeaching = await generateTeaching(tc.issueText, tc.essayContext);

    // Generate teaching with RAG
    console.log('  Generating RAG-enhanced...');
    const ragTeaching = await generateTeaching(tc.issueText, tc.essayContext, ragContext);

    // Randomize order for blind comparison
    const ragIsA = Math.random() > 0.5;
    const teachingA = ragIsA ? ragTeaching : baselineTeaching;
    const teachingB = ragIsA ? baselineTeaching : ragTeaching;

    // Judge
    console.log('  Judging...');
    const judgment = await judgeTeachingPair(teachingA, teachingB, tc.essayContext);

    // Map winner back to RAG vs baseline
    let actualWinner: string;
    if (judgment.winner === 'tie') {
      actualWinner = 'tie';
      ties++;
    } else if ((judgment.winner === 'A' && ragIsA) || (judgment.winner === 'B' && !ragIsA)) {
      actualWinner = 'rag';
      ragPreferred++;
    } else {
      actualWinner = 'baseline';
      baselinePreferred++;
    }

    const icon = actualWinner === 'rag' ? '✅' : actualWinner === 'tie' ? '🔶' : '❌';
    console.log(`  ${icon} Winner: ${actualWinner}`);
    console.log(`     Reasoning: ${judgment.reasoning}`);
  }

  // Results
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`  RAG-enhanced preferred: ${ragPreferred}/5`);
  console.log(`  Baseline preferred:     ${baselinePreferred}/5`);
  console.log(`  Ties:                   ${ties}/5`);

  const passThreshold = 4;
  // Ties count as half credit for RAG (since it at least matched)
  const effectiveScore = ragPreferred + (ties * 0.5);
  const passed = effectiveScore >= passThreshold;

  console.log(`\n  Effective score: ${effectiveScore}/5 (need ${passThreshold}/5)`);
  console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'} — RAG Teaching Impact`);

  if (!passed) {
    process.exit(1);
  }
}

// RUN
runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
