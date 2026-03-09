/**
 * Pattern: Dialogue Opening
 * Category: opening
 *
 * Opens with spoken words — either a direct quote or an overheard exchange.
 * Creates immediacy by putting a human voice before any narrative setup.
 */

import { patternRegistry } from '../../registry/patternRegistry';
import type { PatternManifest } from '../../shared/types';

const manifest: PatternManifest = {
  id: 'dialogue_opening',
  category: 'opening',
  displayName: 'Dialogue Opening',

  // Detects: essay starting with a quotation mark (straight or curly)
  detection: /^[\s\n]*[""'\u201C\u2018]/,

  teaching: `A dialogue opening places a human voice before any narrative scaffolding. The reader hears someone speak before they know who is speaking, where they are, or what the situation is — which creates immediate intrigue. Dialogue openings work best when the spoken words are surprising, revealing, or ambiguous. The words should raise a question the essay then spends its length answering. Avoid dialogue that merely states a situation; the words must do more than inform.`,

  beforeAfter: {
    before: `My grandmother and I have always had a complicated relationship. She grew up in a very different time and culture, so we often disagreed about how I should live my life. One day she said something that changed my perspective.`,
    after: `"You don't look Indian," she said, and paused, as if waiting to see what I would do with that.

I didn't know yet. That was the problem — and the beginning of three years of trying to find out.`,
  },
};

patternRegistry.register(manifest);
