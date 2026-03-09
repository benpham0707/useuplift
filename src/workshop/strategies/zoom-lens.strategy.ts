/**
 * Strategy: Zoom Lens
 *
 * Opens at narrative distance then progressively zooms into a single
 * charged micro-moment. Achieves intimacy by contrasting scale.
 */

import { strategyRegistry } from '../registry/strategyRegistry';
import type { StrategyManifest } from '../shared/types';

const manifest: StrategyManifest = {
  id: 'zoom_lens',
  displayName: 'Zoom Lens',
  description: 'Open at distance and progressively narrow to one charged micro-moment.',

  bestFor: ['personal_statement', 'challenge_adversity', 'community', 'identity_background'],

  detection: {
    signals: [
      'Opening paragraph establishes broad context or pattern ("For three years...", "Every Saturday...")',
      'Second or third paragraph suddenly narrows to a single specific date, time, or moment',
      'Sensory detail density increases sharply in the second half of the essay',
      'Time slows — what takes one sentence at the start takes a paragraph later',
      'One moment is described in much greater granularity than the rest',
    ],
    threshold: 0.5,
  },

  teaching: {
    explanation: `The zoom lens essay establishes a wide frame — a pattern, a context, a recurring experience — then crashes into a single moment with extreme specificity. The contrast in scale creates emotional impact. The reader understands the stakes from the wide frame, then lives inside one crystallizing instant.`,

    howToUse: `Open with the general pattern: how often this happened, what it usually looked like, the emotional landscape. Then cut to one specific instance — a single morning, a single conversation, a single decision. Zoom in on the sensory details of that moment until time effectively slows. The reflection that follows carries the weight of both the single moment and the pattern it belongs to.`,

    pitfalls: [
      'Spending too long in the wide frame — the zoom should begin by paragraph two',
      'Forgetting to zoom all the way — stop at a single date, then a single hour, then a single breath if you can',
      'Using the same level of detail throughout — the contrast between wide and narrow IS the technique',
      'Zooming into a moment that is not sufficiently charged — the micro-moment must hold the essay\'s emotional weight',
      'Ending at the zoomed-in moment without pulling back — you need a brief final beat that re-establishes meaning',
    ],
  },

  examples: [
    {
      title: 'From pattern to crystallizing instant',
      excerpt: `Every Thursday for two years, I translated at my mother's doctor appointments. Insurance forms, medication instructions, discharge summaries — I had become fluent in the grammar of medical bureaucracy before I was fluent in chemistry.

Then came November 14th. The oncologist used the word "malignant" and paused, and I felt the three-second gap before my mother looked at me, and I understood that the next words I spoke would be the ones she would remember for the rest of her life.`,
      analysis: `The wide frame establishes the pattern (two years of translation) and the student's competence. The zoom lands on a single three-second pause — an almost absurdly compressed unit of time — which now carries the weight of everything that came before. "The next words I spoke" lands with enormous force because the wide frame earned it.`,
    },
    {
      title: 'Place-based zoom from community to corner',
      excerpt: `My neighborhood has forty-seven murals. I counted them one summer when I had nothing but time and a cheap camera.

But the one I kept coming back to was the unfinished one on Clement Street — three figures, no faces, a door that opened onto blank white wall. I would sit on the curb across from it and eat my lunch and wonder what the artist was afraid to paint.`,
      analysis: `Forty-seven murals narrows to one, then narrows further to a single door in a single mural. The zoom reveals character: this is someone who looks hard at incomplete things, who wonders about absence. All of that comes from the telescoping focus, not from the writer stating it.`,
    },
  ],
};

strategyRegistry.register(manifest);
