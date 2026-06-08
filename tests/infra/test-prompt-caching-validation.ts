/**
 * Test: Prompt Caching Validation
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-prompt-caching-validation.ts
 * NEEDS API key — validates that prompt caching reduces cost
 *
 * Makes two identical calls to verify cache_read_input_tokens > 0 on the second call.
 */

import { requireApiKey } from '../utils/loadEnv';

const apiKey = requireApiKey('ANTHROPIC_API_KEY');

import { callClaude, calculateCost } from '../../src/lib/llm/claude';

let passed = 0;
let failed = 0;
let totalCost = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

// Build a long system prompt (> 4096 tokens) to qualify for caching on Haiku 4.5
function buildLongSystemPrompt(): string {
  const sections = [
    'You are a college admissions essay writing coach with deep expertise in narrative craft.',
    'Your role is to provide specific, actionable feedback that preserves the student\'s authentic voice.',
    '',
    'SCORING RUBRIC:',
    '1. Voice Integrity (0-10): Does the writing sound authentically like the student?',
    '2. Specificity & Evidence (0-10): Are claims supported with concrete details?',
    '3. Transformative Impact (0-10): Does the essay show genuine growth or change?',
    '4. Role Clarity (0-10): Is the student\'s unique contribution clear?',
    '5. Narrative Arc (0-10): Does the essay have tension, stakes, and resolution?',
    '6. Initiative & Leadership (0-10): Does the student show proactive behavior?',
    '7. Community & Collaboration (0-10): How does the student relate to others?',
    '8. Reflection & Meaning (0-10): Does the essay demonstrate insight?',
    '9. Craft & Language (0-10): Is the writing polished and purposeful?',
    '10. Fit & Trajectory (0-10): Does it connect to future goals?',
    '11. Time Investment (0-10): Does it show sustained commitment?',
    '',
    'GUIDELINES:',
    '- Always preserve the student\'s voice — never make them sound like an adult',
    '- Prefer showing over telling — help them build scenes with sensory detail',
    '- Focus on one dimension at a time for targeted improvement',
    '- Use teaching language that builds understanding, not just gives answers',
    '- Connect feedback to transferable writing principles',
    '- Acknowledge what\'s working before suggesting changes',
    '- Provide specific examples of how to implement changes',
    '- Maintain appropriate developmental expectations for high school students',
    '',
    'When analyzing text, consider:',
    '- The surrounding context and essay type (Common App, UC PIQ, supplement)',
    '- The student\'s background and experiences',
    '- The word count constraints of the target application',
    '- Whether the writing is a first draft, revision, or near-final version',
    '',
    'RESPONSE FORMAT:',
    'Always return valid JSON with the structure:',
    '{ "analysis": string, "score": number }',
    '',
    // Pad to ensure > 4096 tokens (Haiku 4.5 requires 4096+ tokens for prompt caching)
    ...Array(80).fill('Additional coaching context: Focus on authentic voice preservation, concrete detail, and transferable writing principles that empower the student to improve independently. Remember to consider the essay holistically — each dimension interacts with others, and a strength in one area can compensate for a developing area in another. The best college essays reveal character through specific moments rather than broad claims about personality traits.'),
  ];
  return sections.join('\n');
}

async function main() {
  console.log('\n=== Prompt Caching Validation Test ===\n');

  const systemPrompt = buildLongSystemPrompt();
  const userPrompt = 'Analyze this essay opening: "The smell of burnt rice always takes me back to that kitchen, where my grandmother taught me patience by teaching me to cook."';

  console.log(`System prompt length: ${systemPrompt.length} chars (~${Math.ceil(systemPrompt.length / 4)} tokens)\n`);

  // --- Call 1: Should create cache ---
  console.log('--- Call 1: Creating cache ---\n');

  const response1 = await callClaude<{ analysis: string; score: number }>(userPrompt, {
    systemPrompt,
    model: 'claude-haiku-4-5-20251001',
    temperature: 0,
    maxTokens: 500,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  const usage1 = response1.usage;
  const cost1 = calculateCost(usage1);
  totalCost += cost1;

  console.log(`  Input tokens: ${usage1.input_tokens}`);
  console.log(`  Output tokens: ${usage1.output_tokens}`);
  console.log(`  Cache creation: ${(usage1 as any).cache_creation_input_tokens || 0}`);
  console.log(`  Cache read: ${(usage1 as any).cache_read_input_tokens || 0}`);
  console.log(`  Cost: $${cost1.toFixed(6)}`);

  const cacheCreation1 = (usage1 as any).cache_creation_input_tokens || 0;
  assert(cacheCreation1 > 0, `Call 1 created cache (${cacheCreation1} tokens cached)`);

  // Short delay to ensure cache is available
  await new Promise(r => setTimeout(r, 1000));

  // --- Call 2: Should read from cache ---
  console.log('\n--- Call 2: Reading from cache ---\n');

  const response2 = await callClaude<{ analysis: string; score: number }>(userPrompt, {
    systemPrompt,
    model: 'claude-haiku-4-5-20251001',
    temperature: 0,
    maxTokens: 500,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  const usage2 = response2.usage;
  const cost2 = calculateCost(usage2);
  totalCost += cost2;

  console.log(`  Input tokens: ${usage2.input_tokens}`);
  console.log(`  Output tokens: ${usage2.output_tokens}`);
  console.log(`  Cache creation: ${(usage2 as any).cache_creation_input_tokens || 0}`);
  console.log(`  Cache read: ${(usage2 as any).cache_read_input_tokens || 0}`);
  console.log(`  Cost: $${cost2.toFixed(6)}`);

  const cacheRead2 = (usage2 as any).cache_read_input_tokens || 0;
  assert(cacheRead2 > 0, `Call 2 used cache (${cacheRead2} tokens from cache)`);

  // --- Cost Comparison ---
  console.log('\n--- Cost Comparison ---\n');

  if (cost1 > 0) {
    const savings = ((1 - cost2 / cost1) * 100).toFixed(1);
    console.log(`  Call 1 cost: $${cost1.toFixed(6)}`);
    console.log(`  Call 2 cost: $${cost2.toFixed(6)}`);
    console.log(`  Savings: ${savings}%`);
    assert(cost2 < cost1 * 0.7, `Call 2 cost < 70% of Call 1 (actual: ${savings}% savings)`);
  } else {
    console.log('  Skipping cost comparison (Call 1 cost was 0)');
    assert(false, 'Call 1 should have non-zero cost');
  }

  // --- Both calls produced valid output ---
  console.log('\n--- Output Validity ---\n');
  assert(typeof response1.content.analysis === 'string', 'Call 1 returned analysis string');
  assert(typeof response1.content.score === 'number', 'Call 1 returned score number');
  assert(typeof response2.content.analysis === 'string', 'Call 2 returned analysis string');
  assert(typeof response2.content.score === 'number', 'Call 2 returned score number');

  // ===== RESULTS =====
  console.log(`\n  Total API cost: $${totalCost.toFixed(6)}`);
  console.log(`\n=== Results: ${passed}/${passed + failed} passed ===`);
  if (failed > 0) {
    console.log(`❌ ${failed} tests FAILED`);
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
