/**
 * Pattern: Forward Look Closing
 * Category: closing
 *
 * Ends with the writer looking ahead — but in a specific, grounded way
 * that grows from the essay's content, not in a generic "I hope to" way.
 */

import { patternRegistry } from '../../registry/patternRegistry';
import type { PatternManifest } from '../../shared/types';

const manifest: PatternManifest = {
  id: 'forward_look_closing',
  category: 'closing',
  displayName: 'Forward Look Closing',

  detection: (text: string): boolean => {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    const lastParagraph = paragraphs[paragraphs.length - 1] ?? '';

    // Detect forward-looking language
    const forwardPatterns = [
      /\b(next|now I|still|from here|what comes next|the question now)\b/i,
      /\b(I want to|I intend to|I am going to|I will)\b/i,
      /\b(unanswered|unfinished|not yet|still learning|still figuring)\b/i,
    ];
    const hasForwardLook = forwardPatterns.some(re => re.test(lastParagraph));

    // Must NOT be generic
    const genericPatterns = [
      /I look forward to contributing/i,
      /I am excited to be part of/i,
      /I hope to make a difference/i,
      /I plan to use these skills/i,
    ];
    const isGeneric = genericPatterns.some(re => re.test(lastParagraph));

    return hasForwardLook && !isGeneric;
  },

  teaching: `A forward look closing ends by gesturing toward what comes next — but specifically, not generically. The difference is grounding: "I want to study neuroscience" is generic; "I want to understand what happens in the three seconds before a wrong answer feels like the right one" is specific and grows from the essay's content. The best forward look closings pose an unanswered question, name a specific next step, or describe an ongoing state of becoming. They suggest the writer is not finished with this subject — which is what a college reader wants to believe.`,

  beforeAfter: {
    before: `I look forward to bringing these experiences and lessons to college. I am excited to contribute to the community and to continue growing as a student and leader. I know that the skills I have developed will serve me well.`,
    after: `I still don't know what the right word is. Not in English, not in Tagalog. I've checked both dictionaries and the answer isn't there.

What I know is that the search itself has become my project. I want to study linguistics because I think the missing word is not a gap — it's a data point about what English and Tagalog each chose not to see.`,
  },
};

patternRegistry.register(manifest);
