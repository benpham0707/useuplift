/**
 * Test: Voice Profile Accuracy — LLM Analysis Quality
 * Run: ANTHROPIC_API_KEY="..." npx tsx tests/test-voice-profile-accuracy.ts
 * NEEDS API key — calls buildFromSample() with diverse writing samples
 *
 * Tests that the voice profile correctly identifies register, formality,
 * vocabulary, and authentic phrases for 3 distinct writing styles.
 */

import { requireApiKey } from '../utils/loadEnv';

const apiKey = requireApiKey('ANTHROPIC_API_KEY');

import { VoiceProfileService } from '../../src/services/voiceProfile/voiceProfileService';
import { calculateCost } from '../../src/lib/llm/claude';

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

// ============================================================================
// TEST SAMPLES
// ============================================================================

const CASUAL_ENERGETIC = `
Okay so picture this — it's 2am, I'm running on pure Red Bull and adrenaline,
and our hackathon project just CRASHED for the third time. My teammate is literally
sleeping on the floor. The judges are walking around in like 4 hours. And I'm sitting
there thinking, "why did I sign up for this again?"

But then something wild happened. I found the bug. It was a single semicolon. ONE
SEMICOLON. And when the app finally loaded, I swear I almost cried. Not gonna lie,
that was the moment I knew I wanted to study CS. Not because of the coding — but
because of that feeling. That rush when something finally clicks after hours of pain.

Honestly? Best night of my life. No cap.
`;

const FORMAL_REFLECTIVE = `
The laboratory was silent save for the rhythmic hum of the centrifuge. I observed the
separation of compounds with methodical precision, recording each measurement in my
research journal. Three months of meticulous work had culminated in this moment — the
verification of our hypothesis regarding protein folding mechanisms in thermophilic
bacteria.

What struck me was not merely the scientific discovery itself, but the epistemological
journey it represented. Each failed experiment had refined my understanding of
experimental design. The discipline required to maintain rigorous methodology in the
face of ambiguous results proved more instructive than any textbook could convey.

This experience crystallized my conviction that scientific inquiry demands both
intellectual humility and unwavering persistence. The most meaningful discoveries
emerge not from singular moments of brilliance, but from the accumulated weight
of careful, systematic investigation.
`;

const EMOTIONAL_VULNERABLE = `
Mom left on a Tuesday. I remember because I had a math test the next day and she
was supposed to help me study. The house felt different after that — bigger somehow,
even though nothing had moved.

My little brother asked me every morning for two weeks when she was coming back.
I kept saying "soon" because the truth felt like swallowing glass. I was sixteen
and suddenly I was the one making dinner, checking homework, pretending I had
answers I didn't have.

The thing about being parentified (I learned that word later, in therapy) is that
you don't realize it's happening. You just... adapt. You become the person everyone
leans on, and you forget that you're still a kid who needs someone to lean on too.

I'm not angry anymore. Not really. But I carry it — that weight of being needed
before I was ready.
`;

async function main() {
  console.log('\n=== Voice Profile Accuracy Test ===\n');
  const svc = new VoiceProfileService();

  // --- Sample 1: Casual / Energetic ---
  console.log('--- Sample 1: Casual Energetic Hackathon Essay ---\n');

  const p1 = await svc.buildFromSample('test-user-1', CASUAL_ENERGETIC, 'essay');
  console.log(`  Register: ${p1.register.primary}`);
  console.log(`  Formality: ${p1.linguistics.formality}`);
  console.log(`  Vocabulary: ${p1.linguistics.vocabularyLevel}`);
  console.log(`  Energy: ${p1.personality.energy}`);
  console.log(`  Phrases: ${p1.authenticPhrases.length}`);
  console.log(`  Confidence: ${p1.confidence}`);

  assert(
    p1.register.primary.includes('energetic') || p1.register.primary.includes('enthusiasm') || p1.register.primary.includes('defiant'),
    `P1 register reasonable (got: ${p1.register.primary})`
  );
  assert(p1.linguistics.formality === 'casual', `P1 formality is casual (got: ${p1.linguistics.formality})`);
  assert(
    p1.linguistics.vocabularyLevel === 'simple' || p1.linguistics.vocabularyLevel === 'clear',
    `P1 vocabulary is simple/clear (got: ${p1.linguistics.vocabularyLevel})`
  );
  assert(p1.authenticPhrases.length >= 1, `P1 has at least 1 authentic phrase (got: ${p1.authenticPhrases.length})`);
  assert(p1.confidence > 0 && p1.confidence <= 1, `P1 confidence between 0-1 (got: ${p1.confidence})`);

  // --- Sample 2: Formal / Reflective ---
  console.log('\n--- Sample 2: Formal Reflective Research Essay ---\n');

  const p2 = await svc.buildFromSample('test-user-2', FORMAL_REFLECTIVE, 'essay');
  console.log(`  Register: ${p2.register.primary}`);
  console.log(`  Formality: ${p2.linguistics.formality}`);
  console.log(`  Vocabulary: ${p2.linguistics.vocabularyLevel}`);
  console.log(`  Energy: ${p2.personality.energy}`);
  console.log(`  Phrases: ${p2.authenticPhrases.length}`);

  assert(
    p2.register.primary.includes('quiet') || p2.register.primary.includes('intensity') || p2.register.primary.includes('curiosity') || p2.register.primary.includes('wonder'),
    `P2 register reasonable (got: ${p2.register.primary})`
  );
  assert(p2.linguistics.formality === 'formal', `P2 formality is formal (got: ${p2.linguistics.formality})`);
  assert(p2.linguistics.vocabularyLevel === 'sophisticated', `P2 vocabulary is sophisticated (got: ${p2.linguistics.vocabularyLevel})`);
  assert(p2.authenticPhrases.length >= 1, `P2 has at least 1 authentic phrase`);
  assert(p2.confidence > 0 && p2.confidence <= 1, `P2 confidence between 0-1 (got: ${p2.confidence})`);

  // --- Sample 3: Emotional / Vulnerable ---
  console.log('\n--- Sample 3: Emotional Vulnerable Family Essay ---\n');

  const p3 = await svc.buildFromSample('test-user-3', EMOTIONAL_VULNERABLE, 'essay');
  console.log(`  Register: ${p3.register.primary}`);
  console.log(`  Formality: ${p3.linguistics.formality}`);
  console.log(`  Vocabulary: ${p3.linguistics.vocabularyLevel}`);
  console.log(`  Energy: ${p3.personality.energy}`);
  console.log(`  Emotional openness: ${p3.personality.emotionalOpenness}`);
  console.log(`  Phrases: ${p3.authenticPhrases.length}`);

  assert(
    p3.register.primary.includes('melancholy') || p3.register.primary.includes('quiet') || p3.register.primary.includes('warmth') || p3.register.primary.includes('loss'),
    `P3 register reasonable (got: ${p3.register.primary})`
  );
  assert(
    p3.linguistics.formality === 'casual' || p3.linguistics.formality === 'semi-formal',
    `P3 formality is casual/semi-formal (got: ${p3.linguistics.formality})`
  );
  assert(
    p3.linguistics.vocabularyLevel === 'clear' || p3.linguistics.vocabularyLevel === 'simple' || p3.linguistics.vocabularyLevel === 'sophisticated',
    `P3 vocabulary is clear/simple/sophisticated (got: ${p3.linguistics.vocabularyLevel})`
  );
  assert(p3.authenticPhrases.length >= 1, `P3 has at least 1 authentic phrase`);
  assert(p3.confidence > 0 && p3.confidence <= 1, `P3 confidence between 0-1 (got: ${p3.confidence})`);

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
