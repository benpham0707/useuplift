/**
 * Pattern: Callback Closing
 * Category: closing
 *
 * Final paragraph returns to a word, image, or scene from the opening,
 * completing the bracket structure.
 */

import { patternRegistry } from '../../registry/patternRegistry';
import type { PatternManifest } from '../../shared/types';

const manifest: PatternManifest = {
  id: 'callback_closing',
  category: 'closing',
  displayName: 'Callback Closing',

  detection: (text: string): boolean => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    if (paragraphs.length < 3) return false;

    const openingParagraph = paragraphs[0].toLowerCase();
    const closingParagraph = paragraphs[paragraphs.length - 1].toLowerCase();

    // Extract significant words from opening
    const stopWords = new Set(['that', 'this', 'with', 'have', 'from', 'they', 'were', 'been', 'when', 'what', 'which', 'will', 'your', 'more', 'also', 'into', 'then', 'than', 'some', 'would', 'could', 'should', 'about', 'these', 'those', 'there', 'their', 'after', 'before']);
    const openingWords = openingParagraph.split(/\s+/).filter(w => w.length > 5 && !stopWords.has(w));
    const closingText = closingParagraph;

    // Check if 2+ significant opening words appear in closing
    const matches = openingWords.filter(w => closingText.includes(w));
    return matches.length >= 2;
  },

  teaching: `A callback closing returns to a word, image, or scene from the essay's opening — completing the bracket and signaling that the essay has arrived somewhere. The callback works because the reader now understands the opening differently; the repeated image is transformed by everything that came between. To write a callback closing: identify your most potent opening image, write your essay, and in the final paragraph, return to that image with subtly different language. The shift in meaning should feel earned, not announced.`,

  beforeAfter: {
    before: `Ultimately, I have grown enormously from this experience. My time with the robotics team taught me to be more collaborative, more resilient, and more creative. I am grateful for every challenge we faced together and excited to bring these lessons with me.`,
    after: `The motor controller still sits on my desk. I've replaced it — we won regionals with its successor — but I kept this one. I think about the forty seconds sometimes. About the choice I made before I knew I was capable of making it.

The untested option worked. Most of the time, it does.`,
  },
};

patternRegistry.register(manifest);
