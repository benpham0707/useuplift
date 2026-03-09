/**
 * Strategy: Montage Technique
 *
 * Juxtaposes distinct scenes or vignettes without linear connective tissue.
 * Each fragment illuminates a facet of the writer's identity, and the
 * accumulation creates meaning greater than any single scene.
 */

import { strategyRegistry } from '../registry/strategyRegistry';
import type { StrategyManifest } from '../shared/types';

const manifest: StrategyManifest = {
  id: 'montage_technique',
  displayName: 'Montage Technique',
  description: 'Juxtapose distinct scenes or vignettes so their accumulation reveals character.',

  bestFor: ['personal_statement', 'uc_piq', 'identity_background'],

  detection: {
    signals: [
      'Multiple scene breaks with white space or horizontal rule',
      'Three or more distinct temporal or spatial settings within 650 words',
      'No explicit transition between scenes (no "then", "after that", "next")',
      'Each paragraph functions as a self-contained unit',
      'Closing paragraph synthesizes or echoes the opening fragment',
    ],
    threshold: 0.6,
  },

  teaching: {
    explanation: `The montage technique assembles meaning the way a film editor cuts between shots — not through narrative continuity, but through resonance. You place three or four distinct moments side by side, and the reader's mind does the work of connecting them. The essay does not need to explain how the scenes relate; the juxtaposition IS the argument.`,

    howToUse: `Choose three to five moments that each capture a different facet of the same core truth about you. They don't need to be chronological. They don't need to be about the same activity. What links them is the underlying quality, question, or tension you are exploring. Open with your most visually specific scene. Close with one that recontextualizes the earlier fragments. Let white space do the work of transition. Trust the reader.`,

    pitfalls: [
      'Explaining the connection between scenes explicitly — the montage works only if the juxtaposition speaks for itself',
      'Choosing scenes that are too similar — they should illuminate different facets, not repeat the same point',
      'Using more than five scenes in 650 words — each needs enough space to land; three or four is optimal',
      'Weak closing that summarizes rather than resonates — the final fragment should feel like a revelation, not a recap',
      'Scenes that are chronologically sequential — montage is not a timeline, it is a collage',
    ],
  },

  examples: [
    {
      title: 'Three-scene identity montage',
      excerpt: `Age seven: I press my ear to the kitchen door and count the rising tones of my grandmother's Cantonese.

Age fourteen: I conjugate Spanish verbs in my head while my teacher speaks, a private translation loop running beneath the lesson.

Age seventeen: I type a Unicode character my phone doesn't recognize, then spend forty minutes building a font patch so it will.`,
      analysis: `Three scenes, zero connective tissue. Each reveals the same quality — an obsessive attention to systems of meaning — through a different domain (oral, written, digital). The essay never says "I love languages" or "I am a systems thinker." The scenes say it together, by accumulation.`,
    },
    {
      title: 'Before-and-after montage with tonal contrast',
      excerpt: `The trophy case had a light that buzzed. I used to count the bulbs — twelve, always twelve — while Coach talked about dedication.

The storage room where we kept the broken trophies had no light at all. I found that out the day I was cut.

The math team classroom has a window that faces east. I do my best work in the hour before anyone else arrives.`,
      analysis: `The three scenes form an arc without narrating it: pride, defeat, reinvention. The writer does not write "I learned resilience." Instead, the choice to end in the math classroom — a quiet, forward-facing space — enacts it. The detail of the east-facing window is the essay's thesis, disguised as an image.`,
    },
  ],
};

strategyRegistry.register(manifest);
