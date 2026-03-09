/**
 * Pattern: Question Opening
 * Category: opening
 *
 * Opens with a question the essay then implicitly or explicitly answers.
 * Works best with non-rhetorical, genuinely surprising questions.
 */

import { patternRegistry } from '../../registry/patternRegistry';
import type { PatternManifest } from '../../shared/types';

const manifest: PatternManifest = {
  id: 'question_opening',
  category: 'opening',
  displayName: 'Question Opening',

  detection: (text: string): boolean => {
    const firstSentence = text.split(/[.!]/)[0]?.trim() ?? '';
    // Question ending with ? as the first sentence
    if (!firstSentence.endsWith('?')) return false;
    // Not a cliche rhetorical question pattern
    const notCliche = !/^(What does it mean to|Have you ever wondered|Why do|What is the meaning)/i.test(firstSentence);
    // Reasonably short — questions under 20 words are more powerful
    const wordCount = firstSentence.split(/\s+/).length;
    return notCliche && wordCount <= 25;
  },

  teaching: `A question opening works when the question is genuinely surprising — when the reader could not have predicted it and is now curious about the answer. The question should be specific, not philosophical in a generic way. "What is leadership?" is weak. "How do you teach someone to quit?" is strong. The essay that follows is the answer. The question must be honest, not rhetorical — you must actually be working toward an answer, not using the question as a device to say something you already know.`,

  beforeAfter: {
    before: `What does it mean to be a leader? This is a question I have thought about a lot during my time as student body president. Leadership, I have come to believe, is about serving others.`,
    after: `How do you teach someone to quit?

My coach spent three practices on it. Not quitting school, not quitting the team — quitting a bad habit mid-competition. The habit of finishing a dive wrong because the wrong finish is more comfortable than the right one.`,
  },
};

patternRegistry.register(manifest);
