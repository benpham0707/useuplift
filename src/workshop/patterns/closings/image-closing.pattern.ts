/**
 * Pattern: Image Closing
 * Category: closing
 *
 * Closes the essay with a concrete image rather than an explicit statement
 * of theme, lesson, or aspiration. The image carries the meaning.
 */

import { patternRegistry } from '../../registry/patternRegistry';
import type { PatternManifest } from '../../shared/types';

const manifest: PatternManifest = {
  id: 'image_closing',
  category: 'closing',
  displayName: 'Image Closing',

  detection: (text: string): boolean => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    const lastParagraph = paragraphs[paragraphs.length - 1] ?? '';

    // Image closing: last paragraph does NOT contain cliche closing phrases
    const weakClosings = [
      /I have learned/i, /this experience taught me/i, /I look forward to/i,
      /in conclusion/i, /I am excited to/i, /I hope to/i, /my goal is/i,
      /I plan to/i, /as I continue/i, /I know that/i
    ];
    const hasWeakClosing = weakClosings.some(re => re.test(lastParagraph));

    // And contains sensory or concrete imagery
    const SENSORY_WORDS = ['light', 'sound', 'smell', 'touch', 'taste', 'dark', 'warm', 'cold', 'bright', 'quiet', 'loud', 'rough', 'smooth', 'sharp', 'soft'];
    const hasSensory = SENSORY_WORDS.some(w => lastParagraph.toLowerCase().includes(w));

    return !hasWeakClosing && hasSensory;
  },

  teaching: `An image closing ends the essay on a concrete sensory detail rather than an explicit statement of meaning. The image resonates with everything that came before and carries the emotional weight of the essay without naming it. Trust the reader to feel what the image means. The best closing images are ones that seem small but contain multitudes — a detail that has been transformed by the essay's journey. Do not end with "I learned" or "I hope." End with what you saw, heard, felt, or held.`,

  beforeAfter: {
    before: `In conclusion, this experience taught me the importance of perseverance and community. I learned that no one succeeds alone. I look forward to continuing to grow as a leader and to contributing to a community that shares my values at college.`,
    after: `That evening, I found my grandmother's red thread in the bottom of my bag — the one she had pressed into my hand at the airport. I had no idea what to do with it. I still don't. But I keep it.`,
  },
};

patternRegistry.register(manifest);
