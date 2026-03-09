/**
 * Pattern: Action Opening
 * Category: opening
 *
 * Opens with an immediate action verb in past tense with no preamble —
 * the scene begins without introduction.
 */

import { patternRegistry } from '../../registry/patternRegistry';
import type { PatternManifest } from '../../shared/types';

const manifest: PatternManifest = {
  id: 'action_opening',
  category: 'opening',
  displayName: 'Action Opening',

  // Detects: essay beginning with a strong action verb in past tense,
  // no orienting "I was" or "It was" preamble
  detection: (text: string): boolean => {
    const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? '';
    // Must start with capital letter then action verb (past tense or continuous)
    const actionStart = /^[A-Z][a-z]*(ed|ing)\b/.test(firstSentence);
    // OR start with a strong verb pattern: Verb + noun
    const verbFirst = /^(The|A|An)?\s*[A-Z][a-z]+\s+(sat|stood|walked|ran|grabbed|heard|felt|watched|held|saw|found|realized|pressed|pulled|pushed|opened|closed|turned|reached|picked|dropped|carried)\b/i.test(firstSentence);
    // Must NOT be a weak opener pattern
    const notWeak = !/^(I have always|Growing up|Ever since|Throughout|In today|Webster)/i.test(firstSentence);
    return (actionStart || verbFirst) && notWeak;
  },

  teaching: `An action opening drops the reader directly into motion — no setup, no context, no "I would like to tell you." The first sentence contains a verb doing real work. This creates immediate forward momentum and signals to the reader that something is happening. The context arrives later, after the reader is already inside the scene. Strong action openings name something specific: a person, an object, an action, a sound. They do not name a feeling or an abstraction.`,

  beforeAfter: {
    before: `I have always been passionate about building things. Ever since I was young, I loved taking apart my toys to see how they worked. This led me to robotics, where I learned important lessons about teamwork and persistence.`,
    after: `The motor controller fried at T-minus forty seconds. I had three options, two of which would disqualify us, and one of which I hadn't tested. I chose the untested one.`,
  },
};

patternRegistry.register(manifest);
