import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: thematic-depth — reflection language density
const thematicDepth: QualitySignalManifest = {
  id: 'thematic_depth',
  dimensionId: 'thematic_depth_reflection',
  displayName: 'Thematic Depth',
  weight: 1.5,
  compute: (features) => {
    // Reflection markers + counterpoints + non-cliche growth language
    const base = Math.min(1, features.reflectionMarkerCount / 4);
    const counterBonus = Math.min(0.3, features.counterpointCount * 0.1);
    const clichePenalty = Math.min(0.4, features.clicheCount * 0.1);
    return Math.max(0, base + counterBonus - clichePenalty);
  },
};

// Signal: insight-depth — complexity of reasoning (clause depth proxy)
const insightDepth: QualitySignalManifest = {
  id: 'insight_depth',
  dimensionId: 'thematic_depth_reflection',
  displayName: 'Insight Depth',
  weight: 1.0,
  compute: (features) => {
    // Higher clause depth + complex vocabulary = deeper reasoning
    const clauseScore = Math.min(1, (features.clauseDepthAvg - 1) / 1.5);
    const vocabScore = Math.min(1, (features.vocabularyRichness - 0.4) / 0.3);
    return (clauseScore * 0.6) + (vocabScore * 0.4);
  },
};

// Signal: insight-uniqueness — non-generic reflection
const insightUniqueness: QualitySignalManifest = {
  id: 'insight_uniqueness',
  dimensionId: 'thematic_depth_reflection',
  displayName: 'Insight Uniqueness',
  weight: 1.2,
  compute: (features, _text) => {
    // Penalize generic "I learned that" + reward specific claim language
    const genericPenalty = Math.min(0.5, features.fillerPhraseCount * 0.1);
    const specificBonus = Math.min(0.6, features.claimCount * 0.15);
    const bannedPenalty = Math.min(0.3, features.bannedTermCount * 0.05);
    return Math.max(0, 0.4 + specificBonus - genericPenalty - bannedPenalty);
  },
};

signalRegistry.register(thematicDepth);
signalRegistry.register(insightDepth);
signalRegistry.register(insightUniqueness);
