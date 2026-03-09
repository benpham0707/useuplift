/**
 * Pattern: Fragment for Emphasis
 * Category: technique
 *
 * A deliberate sentence fragment used to create a rhythmic punch,
 * emphasize a single idea, or simulate the abruptness of a realization.
 */

import { patternRegistry } from '../../registry/patternRegistry';
import type { PatternManifest } from '../../shared/types';

const manifest: PatternManifest = {
  id: 'fragment_emphasis',
  category: 'technique',
  displayName: 'Fragment for Emphasis',

  detection: (text: string): boolean => {
    const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 0);

    // A fragment: 1-4 words, no verb, standalone sentence
    // We approximate by looking for very short sentences adjacent to normal ones
    for (let i = 0; i < sentences.length; i++) {
      const words = sentences[i].split(/\s+/).filter(w => w.length > 0);
      if (words.length >= 1 && words.length <= 4) {
        // Adjacent to a longer sentence
        const prevLen = i > 0 ? (sentences[i - 1].split(/\s+/).length) : 0;
        const nextLen = i < sentences.length - 1 ? (sentences[i + 1].split(/\s+/).length) : 0;
        if (prevLen > 8 || nextLen > 8) {
          return true;
        }
      }
    }
    return false;
  },

  teaching: `A deliberate sentence fragment — used sparingly — creates a rhythmic punch that a complete sentence cannot achieve. Fragments work because they break the reader's expectation of grammatical completion. The abrupt stop forces emphasis. A fragment after a long, flowing sentence creates contrast (long-long-short pattern). A fragment in dialogue can simulate the bluntness of thought or speech. The rule: one fragment per essay, maximum. More than one, and the technique becomes noise. The fragment must be doing real work — naming something essential, landing a discovery, or creating a moment of stillness. "Not yet." or "She didn't." or "Three months." can carry enormous weight in the right position.`,

  beforeAfter: {
    before: `After all of the hard work and long nights we spent preparing for the competition, we finally received the results. Unfortunately, we did not win, but it was still an important experience for me.`,
    after: `We had spent six months preparing. Late nights, revised schematics, three prototypes that didn't work.

We didn't win.

But in the debrief — listening to the team explain what we should have done differently — I realized I was finally thinking like an engineer. Not a student. An engineer.`,
  },
};

patternRegistry.register(manifest);
