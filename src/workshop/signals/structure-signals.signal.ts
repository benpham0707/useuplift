import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: transition-quality — sophistication of paragraph-to-paragraph flow
const transitionQuality: QualitySignalManifest = {
  id: 'transition_quality',
  dimensionId: 'structural_coherence',
  displayName: 'Transition Quality',
  weight: 1.5,
  compute: (_features, text) => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    if (paragraphs.length < 2) return 0.5;

    const WEAK_TRANSITIONS = new Set(['however', 'furthermore', 'moreover', 'additionally', 'in conclusion', 'in summary', 'therefore', 'thus']);

    let sophisticatedTransitions = 0;
    let weakTransitions = 0;

    for (let i = 1; i < paragraphs.length; i++) {
      const firstWord = paragraphs[i].split(/\s+/)[0]?.toLowerCase() ?? '';
      const firstTwoWords = paragraphs[i].split(/\s+/).slice(0, 2).join(' ').toLowerCase();

      if (WEAK_TRANSITIONS.has(firstWord) || WEAK_TRANSITIONS.has(firstTwoWords)) {
        weakTransitions++;
      } else {
        // Check for echo/pivot pattern: significant word from previous paragraph
        const prevWords = new Set(paragraphs[i - 1].toLowerCase().split(/\s+/).filter(w => w.length > 5));
        const currStart = paragraphs[i].toLowerCase().split(/\s+/).slice(0, 5);
        const hasEcho = currStart.some(w => prevWords.has(w));
        if (hasEcho) sophisticatedTransitions++;
      }
    }

    const total = paragraphs.length - 1;
    const weakRatio = weakTransitions / total;
    const sophisticatedRatio = sophisticatedTransitions / total;

    return Math.max(0, Math.min(1, 0.5 + sophisticatedRatio * 0.5 - weakRatio * 0.3));
  },
};

signalRegistry.register(transitionQuality);
