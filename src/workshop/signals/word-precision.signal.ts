import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: word-precision — active voice, low filler, concrete diction
const wordPrecision: QualitySignalManifest = {
  id: 'word_precision',
  dimensionId: 'word_economy_craft',
  displayName: 'Word Precision',
  weight: 2.0,
  compute: (features) => {
    const fillerPenalty = Math.min(0.4, features.fillerPhraseCount * 0.08);
    const passivePenalty = Math.min(0.3, features.passiveVoiceRatio * 0.5);
    const bannedPenalty = Math.min(0.2, features.bannedTermCount * 0.04);
    const vocabBonus = Math.min(0.3, (features.vocabularyRichness - 0.4) * 0.6);
    return Math.max(0, 0.6 + vocabBonus - fillerPenalty - passivePenalty - bannedPenalty);
  },
};

signalRegistry.register(wordPrecision);
