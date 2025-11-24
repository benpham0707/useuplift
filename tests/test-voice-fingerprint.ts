
import { VoiceFingerprintAnalyzer } from '../src/services/analysis/voiceFingerprint';

const sampleEssay = `
I guess you could say I'm a bit of a nerd. Not the cool kind who hacks mainframes, but the kind who gets really excited about moss. Yes, moss. It grows on the north side of trees, right? Wrong. It grows wherever there is moisture. I learned this the hard way when I tried to navigate out of the woods using "common knowledge" and ended up in a swamp.
`;

async function testVoiceFingerprint() {
  console.log('=== TEST: Voice Fingerprint Analyzer ===');
  console.log('Input Text:\n', sampleEssay.trim());
  
  try {
    const fingerprint = await VoiceFingerprintAnalyzer.analyze(sampleEssay);
    console.log('\n=== Result: Voice Fingerprint ===');
    console.log(JSON.stringify(fingerprint, null, 2));
    
    // Validations
    if (fingerprint.tone.toLowerCase().includes('nerd') || fingerprint.tone.toLowerCase().includes('humor') || fingerprint.tone.toLowerCase().includes('self-deprecating')) {
        console.log('✅ Tone detected correctly (Humorous/Self-deprecating).');
    } else {
        console.log('⚠️ Tone might be off:', fingerprint.tone);
    }
    
    if (fingerprint.summary) {
        console.log('✅ Summary instruction generated.');
    }

  } catch (e) {
    console.error('FAILED:', e);
  }
}

testVoiceFingerprint();

