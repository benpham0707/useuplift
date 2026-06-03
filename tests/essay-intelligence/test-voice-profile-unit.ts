/**
 * Test: Voice Profile Unit Tests
 * Run: npx tsx tests/test-voice-profile-unit.ts
 * No API key required — tests pure functions only (no LLM calls)
 *
 * Tests getPromptSummary() with mock profiles and the fingerprint converters.
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

  function createMockProfile(overrides?: Partial<StudentVoiceProfile>): StudentVoiceProfile {
    return {
      userId: 'test-user-1',
      version: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      register: {
        primary: 'energetic_enthusiasm' as any,
        secondary: 'wonder_curiosity' as any,
        confidence: 0.85,
      },
      linguistics: {
        averageSentenceLength: 18,
        sentenceLengthVariety: 7,
        vocabularyLevel: 'clear',
        formality: 'semi-formal',
        fragmentUse: 'effective',
        signatureWords: ['literally', 'honestly', 'wild'],
        avoidWords: ['delve', 'tapestry', 'journey'],
      },
      personality: {
        energy: 'high',
        humor: 'occasional',
        directness: 'very_direct',
        emotionalOpenness: 'open',
      },
      authenticPhrases: [
        { phrase: 'that hit different', source: 'essay', preserveExactly: true },
        { phrase: 'no cap', source: 'chat', preserveExactly: true },
        { phrase: "if I'm being real", source: 'essay', preserveExactly: false },
      ],
      weaknesses: ['Tends to over-explain', 'Sometimes loses focus in long paragraphs'],
      preservationWarnings: ['Keep deliberate sentence fragments', 'Preserve informal tone in dialogue'],
      confidence: 0.85,
      sampleCount: 3,
      lastSampleAt: '2026-01-01T00:00:00Z',
      ...overrides,
    } as StudentVoiceProfile;
  }

  console.log('\n=== Voice Profile Unit Tests ===\n');
  const svc = new VoiceProfileService();

  // --- getPromptSummary ---
  console.log('--- getPromptSummary() ---\n');

  const profile = createMockProfile();
  const summary = svc.getPromptSummary(profile);

  assert(typeof summary === 'string', 'Returns a string');
  assert(summary.length > 0, 'Summary is non-empty');
  assert(summary.includes('energetic_enthusiasm'), 'Contains register');
  assert(summary.includes('clear'), 'Contains vocabulary level');
  assert(summary.includes('semi-formal'), 'Contains formality');
  assert(summary.includes('literally'), 'Contains signature word');
  assert(summary.includes('delve'), 'Contains avoid word');
  assert(summary.includes('DO NOT CHANGE'), 'Contains preservation warnings');
  assert(summary.includes('that hit different'), 'Contains preserved phrase');
  assert(summary.includes('Preserve exactly'), 'Has preserve-exactly section');

  // Test with empty optional fields
  const sparseProfile = createMockProfile({
    linguistics: {
      averageSentenceLength: 12,
      sentenceLengthVariety: 4,
      vocabularyLevel: 'simple',
      formality: 'casual',
      fragmentUse: 'minimal',
      signatureWords: [],
      avoidWords: [],
    },
    authenticPhrases: [],
    weaknesses: [],
    preservationWarnings: [],
  });
  const sparseSummary = svc.getPromptSummary(sparseProfile);
  assert(typeof sparseSummary === 'string', 'Sparse profile returns string');
  assert(!sparseSummary.includes('Signature words:'), 'No signature words section when empty');
  assert(!sparseSummary.includes('Avoid:'), 'No avoid words section when empty');
  assert(!sparseSummary.includes('DO NOT CHANGE:'), 'No preservation warnings when empty');

  // Test summary is compact
  assert(summary.length < 800, `Summary is compact (${summary.length} chars < 800)`);

  // --- fromCommonAppFingerprint ---
  console.log('\n--- fromCommonAppFingerprint() ---\n');

  const mockFingerprint = {
    dominant_register: 'quiet_intensity' as any,
    sentence_rhythms: {
      average_length: 22,
      variety: 8,
      fragment_use: 'effective' as const,
    },
    vocabulary_level: 'sophisticated' as const,
    authentic_phrases: ['the silence spoke', 'hands shaking'],
    voice_weaknesses: ['Goes flat in conclusions'],
    preservation_warnings: ['Keep the quiet tone in the first paragraph'],
  };

  const partial = svc.fromCommonAppFingerprint(mockFingerprint);
  assert(partial.register?.primary === 'quiet_intensity', 'Register mapped correctly');
  assert(partial.linguistics?.averageSentenceLength === 22, 'Sentence length mapped');
  assert(partial.linguistics?.vocabularyLevel === 'sophisticated', 'Vocabulary level mapped');
  assert(partial.authenticPhrases?.length === 2, 'Authentic phrases mapped');
  assert(partial.authenticPhrases?.[0]?.source === 'essay', 'Source set to essay');
  assert(partial.weaknesses?.length === 1, 'Weaknesses mapped');
  assert(partial.preservationWarnings?.length === 1, 'Preservation warnings mapped');

  // --- fromActivityChatFingerprint ---
  console.log('\n--- fromActivityChatFingerprint() ---\n');

  const chatFp = {
    tone: 'Energetic and optimistic',
    vocabulary_level: 'conversational',
    authenticity_markers: ['kept it 100', 'no way'],
  };

  const chatPartial = svc.fromActivityChatFingerprint(chatFp);
  assert(chatPartial.linguistics?.vocabularyLevel === 'simple', 'Conversational → simple vocabulary');
  assert(chatPartial.authenticPhrases?.length === 2, 'Chat markers mapped to phrases');
  assert(chatPartial.authenticPhrases?.[0]?.source === 'chat', 'Source set to chat');
  assert(
    chatPartial.preservationWarnings?.[0]?.includes('energetic and optimistic'),
    'Tone preserved in warnings'
  );

  // --- fromPIQFingerprint ---
  console.log('\n--- fromPIQFingerprint() ---\n');

  const piqFp = {
    sentenceStructure: { pattern: 'Uses deliberate fragments for emphasis', example: 'Just gone.' },
    vocabulary: { level: 'academic', signatureWords: ['intricate', 'resilience'] },
    pacing: { speed: 'measured', rhythm: 'deliberate' },
    tone: { primary: 'Reflective', secondary: 'Melancholic' },
  };

  const piqPartial = svc.fromPIQFingerprint(piqFp);
  assert(piqPartial.linguistics?.vocabularyLevel === 'sophisticated', 'Academic → sophisticated');
  assert(piqPartial.linguistics?.fragmentUse === 'effective', 'Fragment pattern detected');
  assert(piqPartial.linguistics?.signatureWords?.includes('intricate'), 'Signature words mapped');
  assert(
    piqPartial.preservationWarnings?.[0]?.includes('Reflective'),
    'Tone primary in preservation warnings'
  );
  assert(
    piqPartial.preservationWarnings?.[0]?.includes('Melancholic'),
    'Tone secondary in preservation warnings'
  );

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
