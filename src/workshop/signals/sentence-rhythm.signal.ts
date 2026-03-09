import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: sentence-rhythm — variety and intentionality of sentence length patterns
const sentenceRhythm: QualitySignalManifest = {
  id: 'sentence_rhythm',
  dimensionId: 'tonal_sophistication',
  displayName: 'Sentence Rhythm',
  weight: 1.8,
  compute: (features) => {
    // Good rhythm: high sentence variety + mix of short and long
    const varietyScore = features.sentenceVarietyScore; // 0-1
    // Ideal: some short (punch) AND some long (flow)
    const hasShortAndLong = features.shortSentenceRatio > 0.1 && features.longSentenceRatio > 0.1;
    const mixBonus = hasShortAndLong ? 0.2 : 0;
    // Penalty for extremely uniform sentence lengths
    const monotonyPenalty = features.sentenceLengthVariance < 5 ? 0.15 : 0;
    return Math.min(1, varietyScore * 0.8 + mixBonus - monotonyPenalty);
  },
};

signalRegistry.register(sentenceRhythm);
