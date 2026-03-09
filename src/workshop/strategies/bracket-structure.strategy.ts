/**
 * Strategy: Bracket Structure
 *
 * Opens and closes with the same image, phrase, or scene — but the
 * second appearance carries new meaning earned by the essay's journey.
 */

import { strategyRegistry } from '../registry/strategyRegistry';
import type { StrategyManifest } from '../shared/types';

const manifest: StrategyManifest = {
  id: 'bracket_structure',
  displayName: 'Bracket Structure',
  description: 'Frame the essay by returning to the opening image at the close — but transformed.',

  bestFor: ['personal_statement', 'uc_piq', 'challenge_adversity', 'community'],

  detection: {
    signals: [
      'Closing paragraph echoes language or imagery from the opening paragraph',
      'Same physical object, place, or action appears at both ends of the essay',
      'Final line is a direct callback to the first sentence',
      'The repeated image uses subtly different language the second time',
      'Essay body explicitly changes the reader\'s understanding of the opening image',
    ],
    threshold: 0.4,
  },

  teaching: {
    explanation: `The bracket structure (sometimes called "bookending") opens and closes with the same image, scene, or phrase — but the return landing creates new meaning. The reader experiences the opening, travels through transformation or insight, and arrives at the identical frame with completely changed understanding. The ending is the same as the beginning, and nothing like it.`,

    howToUse: `Identify the image or moment you want to use as your bracket. Open with it in a way that raises a question or creates a mood. Build the body of the essay as a journey that answers that question or earns a different emotional relationship to that image. Close by returning to the same image — but now with the reader's understanding fundamentally changed. The second appearance should feel like a key turning in a lock.`,

    pitfalls: [
      'Making the return too literal — copying the opening word-for-word suggests the essay didn\'t move anywhere',
      'Leaving the reader to do all the recontextualization — give a small signal that you know the world has changed',
      'Choosing an opening image that cannot be transformed by the essay\'s journey',
      'Ending with "I realized that the X I had always known was really Y" — the bracket works by showing, not explaining the shift',
      'Using the bracket as a shortcut when the essay body hasn\'t actually earned the reframing',
    ],
  },

  examples: [
    {
      title: 'Object-based bracket: a broken metronome',
      excerpt: `Opening: The metronome on the piano had been broken since 1987. My grandmother said it kept perfect time; she just didn't need to hear it anymore.

[Essay body: learning that grandmother escaped Cambodia with nothing, that the metronome was one of three objects she brought, that "perfect time" was her private joke — it measured the beats of survival, not music.]

Closing: I wind the metronome now when I practice. It doesn't tick. But I understand, finally, what she meant about perfect time.`,
      analysis: `The broken metronome opens as a mysterious detail. After learning its history, the same object closes the essay completely transformed. "Perfect time" means something entirely different in the final line. The bracket has done its work: same words, opposite meaning.`,
    },
    {
      title: 'Action-based bracket: filling a form',
      excerpt: `Opening: I filled in the box marked "Race" by leaving it blank. I had done this on every form since I was twelve.

[Essay body: discovering family history across three countries, interviewing grandmother, finding that no single box held the answer.]

Closing: The next form I filled in, I wrote across the box in small letters: "See attached." I had finally found something true enough to submit.`,
      analysis: `The blank box opens as a small rebellion the reader doesn't fully understand. The essay earns the closing action — "see attached" — by making us understand what the blank was protecting and what would now fill it. Same gesture, opposite meaning.`,
    },
  ],
};

strategyRegistry.register(manifest);
