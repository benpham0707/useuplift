import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: character-revelation — shows change through action/behavior
const characterRevelation: QualitySignalManifest = {
  id: 'character_revelation',
  dimensionId: 'growth_transformation_arc',
  displayName: 'Character Revelation',
  weight: 1.5,
  compute: (features) => {
    // Growth language + reflection + dialogue = character revealed through behavior
    const growthScore = Math.min(0.4, features.growthLanguageCount * 0.08);
    const reflectionScore = Math.min(0.3, features.reflectionMarkerCount * 0.06);
    const behaviorScore = features.hasDialogue ? 0.2 : 0;
    const sceneScore = features.hasOpeningScene ? 0.15 : 0;
    return Math.min(1, growthScore + reflectionScore + behaviorScore + sceneScore);
  },
};

// Signal: growth-arc — evidence of before/after transformation
const growthArc: QualitySignalManifest = {
  id: 'growth_arc',
  dimensionId: 'growth_transformation_arc',
  displayName: 'Growth Arc',
  weight: 1.8,
  compute: (features, text) => {
    // Before/after language signals arc
    const beforeAfterPatterns = [
      /\b(used to|before|once I|when I was|had been)\b/gi,
      /\b(now I|I now|no longer|since then|after that)\b/gi,
    ];
    const beforeCount = (text.match(beforeAfterPatterns[0]) || []).length;
    const afterCount = (text.match(beforeAfterPatterns[1]) || []).length;
    // Both before AND after language = genuine arc
    const arcScore = beforeCount > 0 && afterCount > 0
      ? Math.min(0.8, (beforeCount + afterCount) * 0.1)
      : Math.min(0.3, (beforeCount + afterCount) * 0.05);
    const growthBonus = Math.min(0.2, features.growthLanguageCount * 0.04);
    return Math.min(1, arcScore + growthBonus);
  },
};

signalRegistry.register(characterRevelation);
signalRegistry.register(growthArc);
