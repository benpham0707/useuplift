/**
 * Preservation Validation Test
 *
 * Purpose: Validate that college overlay PRESERVES Stage 2A text (100% preservation)
 *
 * Test Methodology:
 * 1. Generate Stage 2A universal suggestions (no college)
 * 2. Generate Stage 2B with college overlay (should enhance, not regenerate)
 * 3. Compare Stage 2B text to Stage 2A text from SAME run
 * 4. Measure preservation rate (should be 100%)
 */

import { TypeSpecificSuggestionService } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import { getCollegeResearch } from '../src/services/commonAppWorkshop/data';
import type { IssueContext } from '../src/services/commonAppWorkshop/services/typeSpecificSuggestionService';
import type { VoiceFingerprint } from '../src/services/commonAppWorkshop/types/contextGathering';

// Simple example essay
const ESSAY_EXAMPLE = `
I've always found myself drawn to questions without clear answers. Last year,
when our biology class covered CRISPR gene editing, most students focused on
memorizing the mechanisms for the test. I couldn't stop thinking about whether
we should use it to eliminate genetic diseases, even if it meant changing the
human gene pool forever.

What excites me about Stanford's intellectual culture is the space to pursue
these kinds of questions seriously. I want to study bioethics at the intersection
of science and philosophy, where I can explore the frameworks we use to make
decisions about technologies we barely understand.
`.trim();

const ISSUE: IssueContext = {
  issue_id: 'issue_1',
  quote: 'I want to study bioethics at the intersection of science and philosophy',
  location: 'Final paragraph',
  diagnosis: {
    problem: 'Future plans stated but not connected to past intellectual journey',
    symptom_type: 'DISCONNECTED_FUTURE',
    affected_dimensions: ['coherence', 'insight'],
    score_impact: -8,
  },
  surrounding_context: ESSAY_EXAMPLE,
  relevant_college_values: [],
  relevant_quotes: [],
};

const mockVoice: VoiceFingerprint = {
  core_markers: ['I', 'we'],
  sentence_rhythms: ['varied'],
  vocabulary_level: 'sophisticated-conversational',
  quirks: [],
  authenticity_score: 75,
  distinctiveness_score: 70,
};

async function runPreservationTest() {
  console.log('\n'.repeat(2));
  console.log('═'.repeat(80));
  console.log('PRESERVATION VALIDATION TEST');
  console.log('═'.repeat(80));
  console.log('\nTest Goal: Validate 100% text preservation when college overlay is applied\n');

  const service = new TypeSpecificSuggestionService();
  const stanford = getCollegeResearch('stanford');

  if (!stanford) {
    throw new Error('Stanford data not found');
  }

  console.log('─'.repeat(80));
  console.log('STAGE 2A: Generating Universal Suggestions (NO college context)');
  console.log('─'.repeat(80));

  const universalOutput = await service.generateSuggestions(
    ESSAY_EXAMPLE,
    'intellectual',
    [ISSUE],
    {
      voice: mockVoice,
      // NO college parameter - pure universal
    }
  );

  const universalSuggestion = universalOutput.issues[0];

  console.log('\n✅ Stage 2A Complete\n');
  console.log('Universal Polished Suggestion:');
  console.log(`"${universalSuggestion.suggestions.polished_original.text}"\n`);
  console.log('Universal Voice Amplifier:');
  console.log(`"${universalSuggestion.suggestions.voice_amplifier.text}"\n`);

  console.log('─'.repeat(80));
  console.log('STAGE 2B: Generating WITH College Overlay (Stanford)');
  console.log('─'.repeat(80));
  console.log('Expected Behavior: PRESERVE Stage 2A text, ADD college-specific enhancements\n');

  const overlayOutput = await service.generateSuggestions(
    ESSAY_EXAMPLE,
    'intellectual',
    [ISSUE],
    {
      voice: mockVoice,
      college: stanford, // WITH college - should enhance, not regenerate
      promptId: 'stanford_intellectual_vitality',
    }
  );

  const overlaySuggestion = overlayOutput.issues[0];

  console.log('\n✅ Stage 2B Complete\n');
  console.log('College-Enhanced Polished Suggestion:');
  console.log(`"${overlaySuggestion.suggestions.polished_original.text}"\n`);
  console.log('College-Enhanced Voice Amplifier:');
  console.log(`"${overlaySuggestion.suggestions.voice_amplifier.text}"\n`);

  console.log('─'.repeat(80));
  console.log('PRESERVATION ANALYSIS');
  console.log('─'.repeat(80));

  const polishedPreserved = universalSuggestion.suggestions.polished_original.text ===
                             overlaySuggestion.suggestions.polished_original.text;

  const voicePreserved = universalSuggestion.suggestions.voice_amplifier.text ===
                          overlaySuggestion.suggestions.voice_amplifier.text;

  console.log('\n📊 Preservation Results:\n');

  if (polishedPreserved) {
    console.log('✅ Polished Suggestion: PRESERVED (100%)');
  } else {
    console.log('❌ Polished Suggestion: CHANGED (0% preservation)');
    console.log(`\n  Stage 2A: "${universalSuggestion.suggestions.polished_original.text.substring(0, 100)}..."`);
    console.log(`  Stage 2B: "${overlaySuggestion.suggestions.polished_original.text.substring(0, 100)}..."`);
  }

  if (voicePreserved) {
    console.log('✅ Voice Amplifier: PRESERVED (100%)');
  } else {
    console.log('❌ Voice Amplifier: CHANGED (0% preservation)');
    console.log(`\n  Stage 2A: "${universalSuggestion.suggestions.voice_amplifier.text.substring(0, 100)}..."`);
    console.log(`  Stage 2B: "${overlaySuggestion.suggestions.voice_amplifier.text.substring(0, 100)}..."`);
  }

  const preservationRate = (polishedPreserved && voicePreserved) ? 100 :
                           (polishedPreserved || voicePreserved) ? 50 : 0;

  console.log(`\n📈 Overall Preservation Rate: ${preservationRate}%`);

  console.log('\n─'.repeat(80));
  console.log('ENHANCEMENT ANALYSIS');
  console.log('─'.repeat(80));

  const rationaleEnhanced = overlaySuggestion.suggestions.polished_original.rationale !==
                           universalSuggestion.suggestions.polished_original.rationale;

  const rationaleHasStanford = overlaySuggestion.suggestions.polished_original.rationale.includes('Stanford');

  console.log('\n📊 Enhancement Results:\n');

  if (rationaleEnhanced) {
    console.log('✅ Rationale: ENHANCED (different from universal)');
  } else {
    console.log('⚠️  Rationale: NOT ENHANCED (same as universal)');
  }

  if (rationaleHasStanford) {
    console.log('✅ College Context: ADDED (mentions Stanford)');
  } else {
    console.log('⚠️  College Context: NOT ADDED (no Stanford mention)');
  }

  console.log('\nUniversal Rationale:');
  console.log(`"${universalSuggestion.suggestions.polished_original.rationale}"\n`);

  console.log('Enhanced Rationale:');
  console.log(`"${overlaySuggestion.suggestions.polished_original.rationale}"\n`);

  console.log('─'.repeat(80));
  console.log('TEST RESULT');
  console.log('─'.repeat(80));

  const passed = preservationRate === 100 && rationaleEnhanced && rationaleHasStanford;

  if (passed) {
    console.log('\n✅ TEST PASSED');
    console.log('   • Text preserved: 100%');
    console.log('   • Rationale enhanced with college context');
    console.log('   • College overlay working as intended\n');
  } else {
    console.log('\n❌ TEST FAILED');
    console.log(`   • Preservation rate: ${preservationRate}% (expected 100%)`);
    console.log(`   • Rationale enhanced: ${rationaleEnhanced}`);
    console.log(`   • College context added: ${rationaleHasStanford}`);
    console.log('\n   Issues to fix:');
    if (preservationRate < 100) {
      console.log('   - College overlay is REGENERATING suggestions instead of ENHANCING');
    }
    if (!rationaleEnhanced) {
      console.log('   - Rationale not being enhanced');
    }
    if (!rationaleHasStanford) {
      console.log('   - College context not being added to rationale');
    }
    console.log('');
  }

  console.log('═'.repeat(80));
  console.log('');

  process.exit(passed ? 0 : 1);
}

runPreservationTest().catch((error) => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
