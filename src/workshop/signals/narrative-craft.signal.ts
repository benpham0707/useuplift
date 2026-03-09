import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: show-dont-tell — sensory detail vs emotion word ratio
const showDontTell: QualitySignalManifest = {
  id: 'show_dont_tell',
  dimensionId: 'narrative_craft_storytelling',
  displayName: 'Show Don\'t Tell',
  weight: 2.0,
  compute: (features) => {
    const sensoryDensity = features.sensoryDetailCount / Math.max(features.wordCount / 100, 1);
    const emotionDensity = features.emotionWordCount / Math.max(features.wordCount / 100, 1);
    // Good ratio: high sensory + low direct emotion (showing vs telling)
    const sensoryScore = Math.min(0.6, sensoryDensity * 0.2);
    const tellPenalty = Math.min(0.3, emotionDensity * 0.08);
    const sceneBonus = features.hasOpeningScene ? 0.2 : 0;
    const dialogueBonus = features.hasDialogue ? 0.15 : 0;
    return Math.min(1, sensoryScore + sceneBonus + dialogueBonus - tellPenalty);
  },
};

// Signal: concrete-detail-density — specificity of imagery
const concreteDetailDensity: QualitySignalManifest = {
  id: 'concrete_detail_density',
  dimensionId: 'narrative_craft_storytelling',
  displayName: 'Concrete Detail Density',
  weight: 1.5,
  compute: (features, text) => {
    // Proxy: numbers, proper nouns, sensory words all indicate concrete detail
    const numbers = (text.match(/\b\d+\b/g) || []).length;
    const properNouns = (text.match(/\b[A-Z][a-z]{2,}\b/g) || []).length;
    const density = (numbers + properNouns + features.sensoryDetailCount) / Math.max(features.wordCount / 50, 1);
    return Math.min(1, density * 0.3);
  },
};

signalRegistry.register(showDontTell);
signalRegistry.register(concreteDetailDensity);
