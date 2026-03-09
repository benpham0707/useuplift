/**
 * Pattern: Pivot Transition
 * Category: transition
 *
 * Uses a single pivot word or image to change the essay's direction
 * without an explicit transition sentence.
 */

import { patternRegistry } from '../../registry/patternRegistry';
import type { PatternManifest } from '../../shared/types';

const manifest: PatternManifest = {
  id: 'pivot_transition',
  category: 'transition',
  displayName: 'Pivot Transition',

  detection: (text: string): boolean => {
    // Detect implicit pivots: paragraphs starting with a single short sentence
    // that does not begin with a transition word but clearly shifts direction
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
    const TRANSITION_WORDS = ['However', 'Moreover', 'Furthermore', 'Additionally', 'Nevertheless', 'Consequently', 'Therefore', 'Meanwhile'];

    let pivotFound = false;
    for (let i = 1; i < paragraphs.length; i++) {
      const firstSentence = paragraphs[i].split(/[.!?]/)[0]?.trim() ?? '';
      const wordCount = firstSentence.split(/\s+/).length;
      const noExplicitTransition = !TRANSITION_WORDS.some(t => firstSentence.startsWith(t));
      // Short sentence (under 8 words) that starts a paragraph = likely pivot
      if (wordCount <= 8 && wordCount >= 2 && noExplicitTransition) {
        pivotFound = true;
        break;
      }
    }
    return pivotFound;
  },

  teaching: `A pivot transition changes the essay's direction without announcing the change. Instead of "However, I began to see things differently," the paragraph simply begins with the different thing. A pivot is often a short, declarative sentence that reorients the reader mid-essay. It trusts the reader to follow the turn without a signpost. Effective pivot transitions use the final image of one paragraph and the opening image of the next to create resonance — the ending of one becomes the launch point of the next.`,

  beforeAfter: {
    before: `I had always thought of coding as a solitary activity. I would sit alone for hours, working through problems by myself. However, when I joined the robotics team, I began to see things differently. I learned that collaboration was actually an important part of the process.`,
    after: `I had always thought of coding as a solitary activity. Hours alone, a problem, a screen.

Then Maya joined the team.

She debugged by talking out loud — narrating every assumption, every wrong turn. Within a week, I was doing it too. Within a month, our error rate dropped by half.`,
  },
};

patternRegistry.register(manifest);
