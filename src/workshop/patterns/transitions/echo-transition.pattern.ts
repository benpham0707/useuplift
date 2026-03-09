/**
 * Pattern: Echo Transition
 * Category: transition
 *
 * Opens a new paragraph with a word or phrase from the previous paragraph's
 * final sentence, creating a verbal bridge between sections.
 */

import { patternRegistry } from '../../registry/patternRegistry';
import type { PatternManifest } from '../../shared/types';

const manifest: PatternManifest = {
  id: 'echo_transition',
  category: 'transition',
  displayName: 'Echo Transition',

  detection: (text: string): boolean => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    if (paragraphs.length < 2) return false;

    for (let i = 1; i < paragraphs.length; i++) {
      const prevParagraph = paragraphs[i - 1];
      const currParagraph = paragraphs[i];

      // Get last sentence of previous paragraph
      const prevSentences = prevParagraph.split(/[.!?]/).filter(s => s.trim().length > 0);
      const lastSentence = prevSentences[prevSentences.length - 1]?.toLowerCase() ?? '';

      // Get first sentence of current paragraph
      const firstSentence = currParagraph.split(/[.!?]/)[0]?.toLowerCase() ?? '';

      // Extract significant words (length > 4, not common stop words)
      const stopWords = new Set(['that', 'this', 'with', 'have', 'from', 'they', 'were', 'been', 'when', 'what', 'which', 'will', 'your', 'more', 'also', 'into', 'then', 'than', 'some', 'would', 'could', 'should']);
      const prevWords = lastSentence.split(/\s+/).filter(w => w.length > 4 && !stopWords.has(w));
      const currWords = new Set(firstSentence.split(/\s+/));

      const hasEcho = prevWords.some(w => currWords.has(w));
      if (hasEcho) return true;
    }
    return false;
  },

  teaching: `An echo transition carries a word or image forward from the end of one paragraph into the beginning of the next, creating a verbal bridge without explicit transition language. The repeated word lands differently in its new context — the reader's understanding of it has shifted. Echo transitions create cohesion at the sentence level rather than the structural level. They suggest that the essay is thinking, not just moving from point to point.`,

  beforeAfter: {
    before: `That day in the clinic, I understood what it meant to translate not just words, but fear. My mother's hands were shaking.

Furthermore, this experience made me want to become a doctor. I realized that medicine required both technical knowledge and human connection.`,
    after: `That day in the clinic, I understood what it meant to translate not just words, but fear. My mother's hands were shaking.

Fear, I was learning, had its own vocabulary. The doctor spoke in probabilities; my mother heard certainties. My job was to find the space between them.`,
  },
};

patternRegistry.register(manifest);
