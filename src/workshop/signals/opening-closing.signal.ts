import { signalRegistry } from '../registry/signalRegistry';
import type { QualitySignalManifest } from '../shared/types';

// Signal: opening-impact — strength of first paragraph
const openingImpact: QualitySignalManifest = {
  id: 'opening_impact',
  dimensionId: 'opening_hook_engagement',
  displayName: 'Opening Impact',
  weight: 2.0,
  compute: (features, text) => {
    const firstParagraph = text.split(/\n\s*\n/)[0] ?? '';
    const firstSentence = firstParagraph.split(/[.!?]/)[0] ?? '';

    let score = 0.3; // baseline

    // Scene in opening
    if (features.hasOpeningScene) score += 0.25;

    // Dialogue in opening
    if (/^[""'\u201C\u2018]/.test(firstSentence.trim())) score += 0.2;

    // Action verb in opening
    if (/\b(walked|ran|sat|stood|grabbed|opened|turned|felt|saw|heard|realized|pressed)\b/i.test(firstSentence)) score += 0.15;

    // Short punchy first sentence
    const firstWords = firstSentence.trim().split(/\s+/).length;
    if (firstWords <= 10 && firstWords >= 3) score += 0.1;

    // Weak opening penalty
    if (/^(I have always|Growing up|Ever since|Throughout|In today)/i.test(firstSentence.trim())) score = 0.1;

    return Math.min(1, score);
  },
};

// Signal: closing-resonance — strength of final paragraph
const closingResonance: QualitySignalManifest = {
  id: 'closing_resonance',
  dimensionId: 'closing_impact_resolution',
  displayName: 'Closing Resonance',
  weight: 2.0,
  compute: (_features, text) => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    const lastParagraph = paragraphs[paragraphs.length - 1] ?? '';

    let score = 0.3; // baseline

    // Penalize generic closings
    const genericClosings = ['I look forward to', 'in conclusion', 'I am excited to', 'I hope to', 'I plan to', 'this experience taught me', 'I have learned that'];
    const isGeneric = genericClosings.some(g => lastParagraph.toLowerCase().includes(g.toLowerCase()));
    if (isGeneric) return 0.1;

    // Reward callback to opening
    const openingParagraph = paragraphs[0] ?? '';
    const openWords = openingParagraph.toLowerCase().split(/\s+/).filter(w => w.length > 5);
    const closeWords = new Set(lastParagraph.toLowerCase().split(/\s+/));
    const callbackCount = openWords.filter(w => closeWords.has(w)).length;
    if (callbackCount >= 2) score += 0.3;

    // Reward concrete imagery in closing
    const SENSORY_WORDS = ['light', 'sound', 'warm', 'cold', 'bright', 'quiet', 'rough', 'smooth', 'dark', 'sharp'];
    if (SENSORY_WORDS.some(w => lastParagraph.toLowerCase().includes(w))) score += 0.2;

    // Reward short, punchy final sentence
    const sentences = lastParagraph.split(/[.!?]/).filter(s => s.trim().length > 0);
    const lastSentence = sentences[sentences.length - 1]?.trim() ?? '';
    if (lastSentence.split(/\s+/).length <= 8) score += 0.1;

    return Math.min(1, score);
  },
};

signalRegistry.register(openingImpact);
signalRegistry.register(closingResonance);
