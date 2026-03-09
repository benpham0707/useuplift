/**
 * Pattern: Anaphora Technique
 * Category: technique
 *
 * Repetition of a word or phrase at the start of successive sentences
 * or clauses. Creates rhythm, emphasis, and cumulative emotional force.
 */

import { patternRegistry } from '../../registry/patternRegistry';
import type { PatternManifest } from '../../shared/types';

const manifest: PatternManifest = {
  id: 'anaphora_technique',
  category: 'technique',
  displayName: 'Anaphora',

  detection: (text: string): boolean => {
    const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 0);

    // Look for 3+ consecutive sentences starting with the same word or 2-word phrase
    for (let i = 0; i <= sentences.length - 3; i++) {
      const s1 = sentences[i].split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      const s2 = sentences[i + 1].split(/\s+/).slice(0, 2).join(' ').toLowerCase();
      const s3 = sentences[i + 2].split(/\s+/).slice(0, 2).join(' ').toLowerCase();

      // First word match
      const firstWords = [s1.split(' ')[0], s2.split(' ')[0], s3.split(' ')[0]];
      if (firstWords[0] === firstWords[1] && firstWords[1] === firstWords[2] && firstWords[0].length > 1) {
        return true;
      }
      // Two-word phrase match
      if (s1 === s2 && s2 === s3 && s1.length > 3) {
        return true;
      }
    }
    return false;
  },

  teaching: `Anaphora repeats a word or phrase at the beginning of successive sentences or clauses. The repetition creates rhythm, emphasis, and cumulative force — each iteration adds weight to the next. Anaphora works best when the repeated element is short and the content of each clause genuinely adds something new. It is a technique that announces itself; use it intentionally and sparingly (one instance per essay, at a moment of high emotional or intellectual intensity). The power comes from the accumulation: the third instance lands harder than the first.`,

  beforeAfter: {
    before: `I thought about my grandmother every day while I was at the competition. I also thought about everything she had taught me about patience. The value of persistence was another thing she had shared with me.`,
    after: `I thought about my grandmother's hands. I thought about the forty years she spent perfecting the same three cuts. I thought about how she called it practice, not work, and what the difference was.`,
  },
};

patternRegistry.register(manifest);
