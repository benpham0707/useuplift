/**
 * Command: Sharpen Diction
 * Family: Precision (Sentence-level)
 *
 * Replaces generic, vague, or overused words with precise, evocative
 * alternatives that carry more meaning per word.
 */

import { commandRegistry } from '../registry/commandRegistry';
import { CommandManifest } from '../shared/types';

const manifest: CommandManifest = {
  id: 'sharpen_diction',
  family: 'precision',
  displayName: 'Sharpen Diction',
  description: 'Replace generic or vague words with precise, evocative alternatives.',
  applicableEssayTypes: [
    'personal_statement',
    'uc_piq',
    'why_us',
    'challenge_adversity',
    'intellectual_vitality',
    'activity_to_essay',
    'identity_background',
    'analytical',
    'other',
  ],
  detailedPrompt: `Replace generic, vague, or overused words with precise, evocative alternatives that carry more meaning per word.

WHAT TO LOOK FOR:
- Generic verbs: "went", "got", "made", "did", "was", "had", "said" — these are invisible; they tell the reader nothing
- Weak adjectives: "nice", "good", "bad", "great", "interesting", "important", "amazing", "incredible"
- Abstract nouns doing concrete work: "situation" (which situation?), "thing" (which thing?), "experience" (what specifically?)
- Thesaurus syndrome: overly fancy replacements that sound artificial ("utilized" instead of "used", "commenced" instead of "started")

HOW TO FIX:
- Replace generic verbs with SPECIFIC action: "went to the lab" → "slipped into the lab"; "said quietly" → "whispered" or "muttered"
- Replace weak adjectives with sensory or specific ones: "nice day" → "cloudless afternoon"; "bad feeling" → "tight knot behind my ribs"
- Prefer the CONCRETE over the ABSTRACT: "the situation" → "the empty chair where Dad used to sit"
- Choose words at the student's vocabulary level — a 16-year-old who says "utilize" sounds coached, not authentic
- ONE precise word beats THREE vague ones: "ran very quickly" → "sprinted"

EXAMPLE:
Before: "I walked into the room and it felt really different. Everything had changed and it was interesting to see."
After: "I stepped into the lab — the benches were rearranged, beakers replaced with PCR machines. The room smelled like isopropanol instead of formaldehyde."

WHAT NOT TO DO:
- Do not replace every word — target the 2-4 weakest words in the passage
- Do not use thesaurus words that sound unnatural for a teenager ("commenced", "endeavored", "facilitated")
- Do not sacrifice clarity for flair — if the precise word is obscure, prefer the clear one
- Do not change the student's MEANING — only upgrade the word that carries it

ANTI-FABRICATION:
Only replace words with alternatives that preserve the student's intended meaning. Never change what a sentence says by choosing a word with a different connotation. If upgrading a generic noun to a specific one, use [brackets] for details you're guessing: "[the chemistry lab]" instead of inventing "Dr. Martinez's lab."

OUTPUT GUIDANCE:
Primary = replace 2-3 weakest words with precise alternatives that fit the student's voice level. Creative = a bolder diction pass — more words upgraded, more evocative choices, pushing toward literary without losing authenticity. Both should highlight which specific words were changed and why.`,
  bannedTerms: [
    'delve',
    'tapestry',
    'myriad',
    'multifaceted',
    'journey',
    'passionate',
    'beacon',
    'utilize',
    'facilitate',
    'endeavor',
    'commence',
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
