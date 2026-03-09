import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: thematic-originality — non-generic subject matter
const thematicOriginality: QualitySignalManifest = {
  id: 'thematic_originality',
  dimensionId: 'originality_voice_authenticity',
  displayName: 'Thematic Originality',
  weight: 1.5,
  compute: (features) => {
    // Lower cliche count + lower banned term count = more original
    const clichePenalty = Math.min(0.6, features.clicheCount * 0.12);
    const bannedPenalty = Math.min(0.3, features.bannedTermCount * 0.06);
    return Math.max(0, 0.7 - clichePenalty - bannedPenalty);
  },
};

// Signal: voice-consistency — consistent register across the essay
const voiceConsistency: QualitySignalManifest = {
  id: 'voice_consistency',
  dimensionId: 'originality_voice_authenticity',
  displayName: 'Voice Consistency',
  weight: 1.2,
  compute: (features) => {
    // Formality score near mid-range (0.35-0.65) = consistent personal voice
    // Very formal or very informal suggests inconsistency in personal essays
    const formalityDeviation = Math.abs(features.formalityScore - 0.45);
    const formalityScore = Math.max(0, 1 - formalityDeviation * 2);
    // Contraction rate signals authentic voice (not too formal, not too casual)
    const contractionScore = Math.min(1, features.contractionRate * 2);
    return (formalityScore * 0.6) + (contractionScore * 0.4);
  },
};

signalRegistry.register(thematicOriginality);
signalRegistry.register(voiceConsistency);
