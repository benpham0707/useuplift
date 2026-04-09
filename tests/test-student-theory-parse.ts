/**
 * StudentTheory JSON Parse — Smoke Test (~$0.01)
 *
 * Makes a single Sonnet call with useJsonMode: true to verify that
 * the StudentTheory synthesis produces valid, parseable JSON.
 *
 * Usage:
 *   ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/test-student-theory-parse.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

import { callClaude, calculateCost } from '../src/lib/llm/claude';

const SONNET = 'claude-sonnet-4-5-20250929';

async function runTest() {
  console.log('=== StudentTheory JSON Parse Smoke Test ===\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  // Simulate the exact prompt structure from coachingService.ts synthesizeStudentTheory()
  const systemPrompt = `You are synthesizing everything the coaching system knows about this student AS A PERSON — not their essay, but who they are when they write.

Read the conversation below and produce a structured theory. This theory is for the COACH'S internal use — the student never sees it.

Every claim needs evidence from the conversation or analysis. Tensions must cite both sides. ProtectedValues must explain the IMPLICATION for coaching (how this should change what the coach does).

Output ONLY a JSON object matching this exact schema:
{
  "personhood": "<2-4 sentences. Who is this person beyond what the essay reveals. Their relationship to writing, their emotional patterns, what they protect.>",
  "protectedValues": [{"value":"<specific thing>","evidence":"<what they said/did>","implication":"<how this should change coaching>"}],
  "blindSpotHypotheses": [{"hypothesis":"<what they can't see>","analysisEvidence":"<from essay analysis>","coachingEvidence":"<from conversation>","readyToSurface":false}],
  "tensions": [{"studentSays":"<quote or paraphrase>","essayShows":"<what the analysis reveals>","coachingOpportunity":"<how to use this tension>"}],
  "essayRelationship": "<1-3 sentences. Why this essay matters to them, what they're trying to prove, what they're afraid of.>",
  "crossLayerPatterns": [{"analysisObservation":"<from essay analysis>","conversationEvidence":"<from chat>","coachingImplication":"<what to do with it>"}],
  "synthesizedAtTurn": 2,
  "pendingObservations": []
}`;

  const userPrompt = `=== CONVERSATION (last 2 turns) ===
STUDENT: What do you think of my essay overall? I wrote it about how playing piano taught me to code.

COACH: Your essay opens strong with the piano imagery, but by P3 the language shifts to brochure-speak. "Reimagining classical boundaries" is the kind of phrase a program description uses, not a person at a keyboard. The real essay is hiding behind the framework — I can see it in the AI DJ project (P4), which is compressed into 6 sentences when it deserves the whole middle section. Right now an AO would summarize you as "piano kid who codes" — but the AI DJ reading emotions wrong at 3am is a scene no one else in the pool has.

=== CROSS-LAYER DATA ===
Writer Portrait: Someone who experiences the world as a series of systems to be understood and optimized.
Blind Spots (from analysis): tendency to explain rather than show; assumes structural parallels are self-evident
Red Flags (from admissions positioning): scope inflation; solo credit for likely teamwork
Student Declared Context: none yet

Synthesize an updated theory. Be specific and evidence-grounded. Output only JSON.`;

  console.log('Calling Sonnet with useJsonMode: true...');
  const startTime = Date.now();

  const response = await callClaude<string>({
    model: SONNET,
    systemPrompt,
    userPrompt,
    maxTokens: 2000,
    temperature: 0.3,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  const timingMs = Date.now() - startTime;
  const cost = calculateCost(response.usage, SONNET);
  console.log(`Response: ${response.usage.input_tokens} input + ${response.usage.output_tokens} output = $${cost.toFixed(4)}, time=${timingMs}ms\n`);

  // With useJsonMode: true, callClaude returns an already-parsed object
  let parsed: Record<string, unknown> | null = null;

  if (response.content && typeof response.content === 'object' && !Array.isArray(response.content)) {
    parsed = response.content as Record<string, unknown>;
    console.log(`✓ Level 0: callClaude returned already-parsed object`);
    console.log(`  Keys: ${Object.keys(parsed).join(', ')}`);
  } else {
    const rawText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    console.log(`Raw output length: ${rawText.length} chars`);
    console.log(`First 300 chars: ${rawText.slice(0, 300)}\n`);

    try {
      parsed = JSON.parse(rawText);
      console.log('✓ Level 1: Direct JSON.parse succeeded');
    } catch (err) {
      console.error('✗ Level 1: Direct JSON.parse FAILED:', (err as Error).message);
      try {
        const stripped = rawText.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
        parsed = JSON.parse(stripped);
        console.log('✓ Level 2: Parse after fence stripping succeeded');
      } catch {
        try {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) { parsed = JSON.parse(match[0]); console.log('✓ Level 3: Regex extract succeeded'); }
        } catch {
          console.error('✗ Levels 1-3 ALL FAILED');
        }
      }
    }
  }

  if (!parsed) {
    console.error('\n=== CRITICAL: Cannot parse StudentTheory output ===');
    console.error('Full raw output:');
    console.error(JSON.stringify(response.content));
    process.exit(1);
  }

  // Test 2: Validate required fields
  console.log('\nField validation:');
  const checks = [
    { field: 'personhood', type: 'string', check: () => typeof parsed!.personhood === 'string' && parsed!.personhood !== 'Theory synthesis incomplete.' },
    { field: 'protectedValues', type: 'array', check: () => Array.isArray(parsed!.protectedValues) },
    { field: 'blindSpotHypotheses', type: 'array', check: () => Array.isArray(parsed!.blindSpotHypotheses) },
    { field: 'tensions', type: 'array', check: () => Array.isArray(parsed!.tensions) },
    { field: 'essayRelationship', type: 'string', check: () => typeof parsed!.essayRelationship === 'string' },
    { field: 'crossLayerPatterns', type: 'array', check: () => Array.isArray(parsed!.crossLayerPatterns) },
    { field: 'synthesizedAtTurn', type: 'number', check: () => typeof parsed!.synthesizedAtTurn === 'number' },
    { field: 'pendingObservations', type: 'array', check: () => Array.isArray(parsed!.pendingObservations) },
  ];

  let allPassed = true;
  for (const { field, type, check } of checks) {
    if (check()) {
      console.log(`  ✓ ${field} (${type})`);
    } else {
      console.error(`  ✗ ${field} — expected ${type}, got: ${JSON.stringify(parsed[field]).slice(0, 100)}`);
      allPassed = false;
    }
  }

  // Test 3: Validate nested structures
  console.log('\nNested structure validation:');
  if (Array.isArray(parsed.protectedValues) && (parsed.protectedValues as any[]).length > 0) {
    const pv = (parsed.protectedValues as any[])[0];
    const hasPV = typeof pv?.value === 'string' && typeof pv?.evidence === 'string' && typeof pv?.implication === 'string';
    console.log(`  ✓ protectedValues[0] has value/evidence/implication: ${hasPV}`);
    if (!hasPV) allPassed = false;
  } else {
    console.log('  ℹ protectedValues empty (acceptable for short conversation)');
  }

  if (Array.isArray(parsed.tensions) && (parsed.tensions as any[]).length > 0) {
    const t = (parsed.tensions as any[])[0];
    const hasT = typeof t?.studentSays === 'string' && typeof t?.essayShows === 'string';
    console.log(`  ✓ tensions[0] has studentSays/essayShows: ${hasT}`);
    if (!hasT) allPassed = false;
  } else {
    console.log('  ℹ tensions empty (acceptable for short conversation)');
  }

  // Summary
  console.log(`\n=== RESULT: ${allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'} ===`);
  console.log(`Cost: $${cost.toFixed(4)}`);
  if (!allPassed) process.exit(1);
}

runTest().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
