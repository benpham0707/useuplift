/**
 * Strategy: Extended Metaphor
 *
 * Sustains a single metaphor or controlling image across the entire essay,
 * with each section adding a new dimension to the same comparison.
 */

import { strategyRegistry } from '../registry/strategyRegistry';
import type { StrategyManifest } from '../shared/types';

const manifest: StrategyManifest = {
  id: 'extended_metaphor',
  displayName: 'Extended Metaphor',
  description: 'Sustain one controlling image across the entire essay, adding new dimensions to it.',

  bestFor: ['personal_statement', 'intellectual_vitality', 'identity_background', 'uc_piq'],

  detection: {
    signals: [
      'Same tenor and vehicle appear in multiple paragraphs',
      'Vocabulary from a single conceptual domain (cooking, architecture, code, music) threads throughout',
      'Transitions reference the metaphor rather than narrative chronology',
      'The essay\'s reflective conclusion is expressed through the metaphorical frame',
      'Title or opening sentence establishes the metaphorical vehicle explicitly',
    ],
    threshold: 0.5,
  },

  teaching: {
    explanation: `An extended metaphor commits to one controlling comparison and develops it across the essay's full length. Each section discovers a new way the comparison holds — or a way it productively breaks down. The metaphor becomes a lens that lets the writer illuminate something personal through something concrete. The reader understands the subject better by understanding the vehicle.`,

    howToUse: `Choose a vehicle (the thing you're comparing to) that has genuine complexity — something you know well enough to find unexpected angles in. Establish it clearly early. Then, as the essay moves through its narrative or argument, keep returning to the vehicle and discovering new dimensions: where does the comparison extend? Where does it break? A metaphor that breaks interestingly is often more powerful than one that holds perfectly. The conclusion should circle back to the vehicle with a final insight about both the vehicle and yourself.`,

    pitfalls: [
      'Forcing the metaphor to work in every sentence — readers notice when comparisons strain; use it at key structural moments',
      'Choosing a vehicle too abstract to generate concrete imagery (e.g., "a journey" is a metaphor about metaphors)',
      'Explaining the metaphor too explicitly — "like a bridge, I connect people" — trust the comparison',
      'Losing the vehicle for three paragraphs and then forcing it back — the thread must be visible throughout',
      'Selecting a cliche vehicle: bridges, journeys, tapestries, puzzles, seeds. Choose something specific to your experience.',
    ],
  },

  examples: [
    {
      title: 'Code debugging as self-revision',
      excerpt: `My first program had forty-seven errors. The compiler, merciless as any editor, returned them all at once.

I learned to read error messages the way I now read my own drafts — not with dread, but with something like curiosity. Every segmentation fault told me exactly where my thinking had slipped. Every null pointer exception named the assumption I had made without checking.

The code compiles now. Most of it. The parts that still break are the interesting parts — the places where I'm still making assumptions I haven't named yet.`,
      analysis: `Code debugging becomes a metaphor for self-knowledge. The vehicle (compiler, error messages, segfaults) remains consistent across all three paragraphs. The shift from "merciless" to "curious" in paragraph two is the essay's growth arc. "Parts that still break" in the close transforms the vehicle from describing the past to describing the ongoing self.`,
    },
    {
      title: 'Sourdough starter as intellectual persistence',
      excerpt: `Sourdough starter requires daily feeding or it dies. Miss a day and you come back to a gray, deflated mass that smells like regret.

My Arabic study looked similar after my sophomore year — a gray, deflated journal with three weeks of missed entries. I almost threw it away.

I kept feeding both. The starter recovered; so did my Arabic. What I didn't expect was that both got stronger from the near-death: the bacteria more acidic, the vocabulary more precise. Neglect, it turns out, is useful if it doesn't kill you.`,
      analysis: `The sourdough starter (a remarkably specific and non-cliche vehicle) maps cleanly to the Arabic study without being explained. "Gray, deflated mass that smells like regret" does double duty — describing both the starter and the abandoned study. The close discovers a new dimension: near-death as catalyst. The metaphor has done what a good metaphor does — revealed something true that couldn't be said directly.`,
    },
  ],
};

strategyRegistry.register(manifest);
