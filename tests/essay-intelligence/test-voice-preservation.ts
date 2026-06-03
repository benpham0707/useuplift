/**
 * Test: Voice Preservation — Prompt Summary Quality
 * Run: npx tsx tests/test-voice-preservation.ts
 * No API key required — tests pure function output quality
 *
 * Verifies that getPromptSummary() captures key voice characteristics
 * for distinct student voices.
 */

import '../utils/loadEnv';

// Ensure Supabase env vars exist (this test only uses pure functions, not DB)
if (!process.env.VITE_SUPABASE_URL && !process.env.SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = 'https://placeholder.supabase.co';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-key-for-import-only';
}

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

async function main() {
  // Dynamic import AFTER env vars are set
  const { VoiceProfileService } = await import('../../src/services/voiceProfile/voiceProfileService');
  type StudentVoiceProfile = import('../src/services/voiceProfile/types').StudentVoiceProfile;

  function createProfile(overrides: Partial<StudentVoiceProfile>): StudentVoiceProfile {
    return {
      userId: 'test',
      version: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      register: { primary: 'energetic_enthusiasm' as any, confidence: 0.8 },
      linguistics: {
        averageSentenceLength: 15,
        sentenceLengthVariety: 5,
        vocabularyLevel: 'clear',
        formality: 'semi-formal',
        fragmentUse: 'moderate',
        signatureWords: [],
        avoidWords: [],
      },
      personality: {
        energy: 'medium',
        humor: 'occasional',
        directness: 'moderate',
        emotionalOpenness: 'open',
      },
      authenticPhrases: [],
      weaknesses: [],
      preservationWarnings: [],
      confidence: 0.8,
      sampleCount: 1,
      lastSampleAt: '2026-01-01T00:00:00Z',
      ...overrides,
    } as StudentVoiceProfile;
  }

  console.log('\n=== Voice Preservation Tests ===\n');
  const svc = new VoiceProfileService();

  // --- Profile 1: Casual, high energy, frequent humor ---
  console.log('--- Profile 1: Casual / High Energy / Frequent Humor ---\n');

  const p1 = createProfile({
    register: { primary: 'energetic_enthusiasm' as any, confidence: 0.9 },
    linguistics: {
      averageSentenceLength: 12,
      sentenceLengthVariety: 8,
      vocabularyLevel: 'simple',
      formality: 'casual',
      fragmentUse: 'effective',
      signatureWords: ['lowkey', 'vibe', 'ngl'],
      avoidWords: ['furthermore', 'moreover', 'henceforth'],
    },
    personality: { energy: 'high', humor: 'frequent', directness: 'very_direct', emotionalOpenness: 'open' },
    authenticPhrases: [
      { phrase: 'that was literally the move', source: 'essay', preserveExactly: true },
    ],
    preservationWarnings: ['Keep the casual slang', 'Do not formalize sentence fragments'],
  });

  const s1 = svc.getPromptSummary(p1);
  assert(s1.includes('casual'), 'P1: Contains "casual" formality');
  assert(s1.includes('high energy'), 'P1: Contains "high" energy');
  assert(s1.includes('frequent humor'), 'P1: Contains "frequent" humor');
  assert(s1.includes('lowkey'), 'P1: Contains signature word "lowkey"');
  assert(s1.includes('furthermore'), 'P1: Contains avoid word "furthermore"');
  assert(s1.includes('DO NOT CHANGE'), 'P1: Contains preservation warnings');
  assert(s1.includes('that was literally the move'), 'P1: Contains preserved phrase');

  // --- Profile 2: Formal, low energy, rare humor ---
  console.log('\n--- Profile 2: Formal / Low Energy / Rare Humor ---\n');

  const p2 = createProfile({
    register: { primary: 'quiet_intensity' as any, confidence: 0.75 },
    linguistics: {
      averageSentenceLength: 28,
      sentenceLengthVariety: 3,
      vocabularyLevel: 'sophisticated',
      formality: 'formal',
      fragmentUse: 'minimal',
      signatureWords: ['intricate', 'deliberate', 'nuanced'],
      avoidWords: ['stuff', 'like', 'basically'],
    },
    personality: { energy: 'low', humor: 'rare', directness: 'circumspect', emotionalOpenness: 'reserved' },
    authenticPhrases: [
      { phrase: 'the weight of silence', source: 'essay', preserveExactly: true },
    ],
    preservationWarnings: ['Preserve formal register throughout'],
  });

  const s2 = svc.getPromptSummary(p2);
  assert(s2.includes('formal'), 'P2: Contains "formal" formality');
  assert(s2.includes('low energy'), 'P2: Contains "low" energy');
  assert(s2.includes('rare humor'), 'P2: Contains "rare" humor');
  assert(s2.includes('sophisticated'), 'P2: Contains "sophisticated" vocabulary');
  assert(s2.includes('intricate'), 'P2: Contains signature word');
  assert(s2.includes('stuff'), 'P2: Contains avoid word');
  assert(s2.includes('the weight of silence'), 'P2: Contains preserved phrase');

  // --- Profile 3: Semi-formal, medium energy, occasional humor ---
  console.log('\n--- Profile 3: Semi-formal / Medium Energy / Occasional Humor ---\n');

  const p3 = createProfile({
    register: { primary: 'warmth_connection' as any, confidence: 0.82 },
    linguistics: {
      averageSentenceLength: 18,
      sentenceLengthVariety: 6,
      vocabularyLevel: 'clear',
      formality: 'semi-formal',
      fragmentUse: 'moderate',
      signatureWords: ['always', 'home', 'belonging'],
      avoidWords: ['tapestry', 'delve'],
    },
    personality: { energy: 'medium', humor: 'occasional', directness: 'moderate', emotionalOpenness: 'open' },
    authenticPhrases: [
      { phrase: 'the smell of rice cooking', source: 'essay', preserveExactly: true },
    ],
    preservationWarnings: ['Do not remove cultural references'],
  });

  const s3 = svc.getPromptSummary(p3);
  assert(s3.includes('semi-formal'), 'P3: Contains "semi-formal" formality');
  assert(s3.includes('medium energy'), 'P3: Contains "medium" energy');
  assert(s3.includes('occasional humor'), 'P3: Contains "occasional" humor');
  assert(s3.includes('clear'), 'P3: Contains "clear" vocabulary');
  assert(s3.includes('the smell of rice cooking'), 'P3: Contains preserved phrase');
  assert(s3.includes('tapestry'), 'P3: Contains avoid word "tapestry"');

  // --- Compactness Check ---
  console.log('\n--- Summary Compactness ---\n');

  assert(s1.length < 600, `P1 summary compact (${s1.length} chars < 600)`);
  assert(s2.length < 600, `P2 summary compact (${s2.length} chars < 600)`);
  assert(s3.length < 600, `P3 summary compact (${s3.length} chars < 600)`);

  // --- Distinctness Check ---
  console.log('\n--- Summary Distinctness ---\n');

  assert(s1 !== s2, 'P1 and P2 summaries are different');
  assert(s2 !== s3, 'P2 and P3 summaries are different');
  assert(s1 !== s3, 'P1 and P3 summaries are different');

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
