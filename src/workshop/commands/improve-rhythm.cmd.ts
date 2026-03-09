/**
 * Command: Improve Rhythm
 * Family: Precision (Sentence-level)
 *
 * Varies sentence length and structure for better cadence. Breaks up
 * monotonous patterns and creates intentional pacing through syntax.
 */

import { commandRegistry } from '../registry/commandRegistry';
import { CommandManifest } from '../shared/types';

const manifest: CommandManifest = {
  id: 'improve_rhythm',
  family: 'precision',
  displayName: 'Improve Rhythm',
  description: 'Vary sentence length and structure for better cadence and pacing.',
  applicableEssayTypes: [
    'personal_statement',
    'uc_piq',
    'why_us',
    'challenge_adversity',
    'intellectual_vitality',
    'activity_to_essay',
    'identity_background',
    'other',
  ],
  detailedPrompt: `Vary sentence length and structure to create intentional rhythm and pacing. Good prose has a heartbeat — long sentences build, short sentences punch.

WHAT TO LOOK FOR:
- **Monotonous length**: 5+ sentences in a row at roughly the same word count (all medium, all long, or all short)
- **Same-start syndrome**: multiple consecutive sentences starting with "I" or the same word/structure
- **Missing fragments**: every sentence is grammatically complete — no deliberate fragments for emphasis
- **Run-on buildup without payoff**: long compound sentences that never land on a short, punchy close
- **Choppy staccato**: too many short sentences in a row without a flowing sentence to connect them

HOW TO FIX:
- **The long-long-short pattern**: build tension with 2 flowing sentences, then land with a short punch. "I spent three weeks debugging the algorithm, tracing variables through nested loops, printing values to the console at 2am. The error was always in the same place. Line 47."
- **Break up same-starts**: if 3 sentences start with "I", restructure one to start with a clause, an action, or an image
- **Add a deliberate fragment**: after a complex thought, a fragment can land like a drum hit. "Not yet." or "Every time." or "Three months."
- **Vary clause structure**: mix simple (subject-verb), compound (X and Y), complex (Because X, Y), and inverted (Into the lab walked...)
- **Match rhythm to content**: fast, choppy rhythm for tension; slow, flowing rhythm for reflection

EXAMPLE:
Before: "I walked into the room. I saw the empty chairs. I felt nervous. I sat down. I waited for my name to be called."
After: "I walked into the room — empty chairs arranged in a semicircle, name tags face-down on each seat. I sat. The fluorescent light buzzed overhead, filling the silence that no one else seemed to notice. Then they called my name."

WHAT NOT TO DO:
- Do not make every sentence a fragment — fragments work because they're rare
- Do not impose a rhythm that contradicts the student's natural voice
- Do not sacrifice clarity for musicality — the sentence must still make sense
- Do not add content — only restructure what's already there

ANTI-FABRICATION:
Only rearrange, split, combine, or restructure existing sentences. Never add new information, events, or details. If combining sentences creates an implication the student didn't intend, keep them separate. Use [brackets] for any connecting words that introduce implied meaning.

OUTPUT GUIDANCE:
Primary = fix the single most monotonous pattern — break up same-starts or add one length variation. Creative = fully rewrite the passage with intentional rhythmic variation — short/long alternation, one fragment, one flowing sentence, demonstrating what "prose with a pulse" sounds like.`,
  bannedTerms: [
    'delve',
    'tapestry',
    'myriad',
    'multifaceted',
    'journey',
    'passionate',
    'beacon',
    'furthermore',
    'moreover',
    'nevertheless',
  ],
  outputFormat: JSON.stringify({
    primary: { text: '...', explanation: '...' },
    creative: { text: '...', explanation: '...' },
    teachingNote: '...',
    principle: '...',
  }),
  tier: 1,
};

commandRegistry.register(manifest);
