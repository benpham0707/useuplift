/**
 * Test: Voice Profile Cross-Workshop Consistency
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-voice-cross-workshop.ts
 * NEEDS API key — builds a profile and validates prompt summary stability
 *
 * Tests that a voice profile produces consistent voice constraints
 * across different usage contexts.
 */

import { requireApiKey } from '../utils/loadEnv';

const apiKey = requireApiKey('ANTHROPIC_API_KEY');

import { VoiceProfileService } from '../../src/services/voiceProfile/voiceProfileService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

const WRITING_SAMPLE = `
I started the robotics club because nobody else would. Our school had zero STEM
activities — I mean literally zero. So I taught myself Arduino from YouTube videos
and convinced Mr. Rivera to let us use the physics lab after school.

The first month was chaos. Nobody knew what a servo was. I barely knew. But there's
something about watching a kid's face light up when their robot arm actually moves
for the first time — that never gets old.

By spring, we had 23 members and entered our first competition. We didn't win. We
came in second to last. But the team voted to keep going, and honestly? That mattered
more to me than any trophy.

The thing people don't tell you about starting something from nothing is how lonely
it can be. You're the one staying late to fix the 3D printer, the one emailing
companies for donations, the one who has to care the most even when nobody else does.
But when it works — when you see something exist that didn't exist before because
of you — that's the real win.
`;

async function main() {
  console.log('\n=== Voice Cross-Workshop Consistency Test ===\n');
  const svc = new VoiceProfileService();

  // --- Build profile from sample ---
  console.log('--- Building voice profile ---\n');

  const profile = await svc.buildFromSample('test-cross-1', WRITING_SAMPLE, 'essay');

  console.log(`  Register: ${profile.register.primary}`);
  console.log(`  Formality: ${profile.linguistics.formality}`);
  console.log(`  Vocabulary: ${profile.linguistics.vocabularyLevel}`);
  console.log(`  Phrases: ${profile.authenticPhrases.length}`);
  console.log(`  Preservation warnings: ${profile.preservationWarnings.length}`);

  // --- Test prompt summary contains all key characteristics ---
  console.log('\n--- Prompt Summary Completeness ---\n');

  const summary = svc.getPromptSummary(profile);
  console.log('  Summary:\n');
  summary.split('\n').forEach(line => console.log(`    ${line}`));
  console.log('');

  assert(summary.includes('STUDENT VOICE PROFILE'), 'Summary has header');
  assert(summary.includes('Register:'), 'Summary has register');
  assert(summary.includes('Avg sentence:'), 'Summary has sentence stats');
  assert(summary.includes('Vocabulary:'), 'Summary has vocabulary');
  assert(summary.includes('Personality:'), 'Summary has personality');

  // Profile-specific checks
  assert(
    summary.includes(profile.register.primary),
    `Summary contains register value "${profile.register.primary}"`
  );
  assert(
    summary.includes(profile.linguistics.formality),
    `Summary contains formality value "${profile.linguistics.formality}"`
  );
  assert(
    summary.includes(profile.linguistics.vocabularyLevel),
    `Summary contains vocabulary level "${profile.linguistics.vocabularyLevel}"`
  );

  // --- Test consistency: same profile always produces same summary ---
  console.log('\n--- Summary Consistency ---\n');

  const summary2 = svc.getPromptSummary(profile);
  assert(summary === summary2, 'Same profile produces identical summary');

  // --- Test with different maxTokens parameter ---
  console.log('\n--- MaxTokens Parameter ---\n');

  const summaryDefault = svc.getPromptSummary(profile);
  const summaryCustom = svc.getPromptSummary(profile, 200);

  // Both should return valid strings (maxTokens is a hint, not hard limit)
  assert(typeof summaryDefault === 'string' && summaryDefault.length > 0, 'Default maxTokens returns valid summary');
  assert(typeof summaryCustom === 'string' && summaryCustom.length > 0, 'Custom maxTokens returns valid summary');

  // --- Voice constraint usability ---
  console.log('\n--- Voice Constraint Usability ---\n');

  // The summary should be usable as a voice constraint block
  assert(summary.length < 1200, `Summary fits prompt budget (${summary.length} chars < 1200)`);
  assert(summary.split('\n').length >= 3, 'Summary has multiple sections');

  // Check that key voice markers are present
  if (profile.linguistics.signatureWords.length > 0) {
    assert(summary.includes('Signature words'), 'Includes signature words section');
  }
  if (profile.linguistics.avoidWords.length > 0) {
    assert(summary.includes('Avoid'), 'Includes avoid words section');
  }
  if (profile.preservationWarnings.length > 0) {
    assert(summary.includes('DO NOT CHANGE'), 'Includes preservation warnings');
  }

  // ===== RESULTS =====
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
