/**
 * Command: Shift Tone
 * Family: Tonal/Emotional
 *
 * Adjusts the emotional register of a passage — more formal, more intimate,
 * more urgent, more reflective — while preserving the content and meaning.
 */

import { commandRegistry } from '../registry/commandRegistry';
import { CommandManifest } from '../shared/types';

const manifest: CommandManifest = {
  id: 'shift_tone',
  family: 'tonal',
  displayName: 'Shift Tone',
  description: 'Adjust the emotional register — more formal, more intimate, more urgent.',
  applicableEssayTypes: [
    'personal_statement',
    'uc_piq',
    'why_us',
    'community',
    'challenge_adversity',
    'intellectual_vitality',
    'activity_to_essay',
    'identity_background',
    'analytical',
    'other',
  ],
  detailedPrompt: `Adjust the emotional register of the selected passage to better serve the essay's purpose. The CONTENT stays the same — only the emotional wrapper changes.

TONE DIRECTIONS TO CONSIDER (infer the best shift from context, or follow the voice profile if one is provided):
- **More intimate**: Move from reporting to confiding. Shorter sentences, more first-person, contractions, direct address of the reader's imagination ("Picture this", internal monologue)
- **More formal**: Elevate diction, lengthen sentences, remove contractions, shift from anecdote to measured reflection. Useful for "Why Us" and analytical essays
- **More urgent**: Compress sentences, add present tense, remove hedging, create forward momentum. "I decided to apply" → "I applied. That night."
- **More reflective**: Slow the pacing, add contemplative pauses, move from action to meaning. Good for conclusions and pivot moments
- **More wry/understated**: Pull back from earnestness, use dry observation, let irony do the emotional work. Good for students who sound over-polished

HOW TO EXECUTE:
1. Identify the current tone (formal? casual? earnest? detached?)
2. Determine the best shift based on context: what comes before and after this passage? What does the essay need at this point?
3. Rewrite with the target tone — same facts, same meaning, different emotional packaging
4. Match sentence structure to tone: intimate = shorter, formal = longer, urgent = fragments

EXAMPLE (shifting from formal to intimate):
Before: "The experience of volunteering at the hospital fundamentally altered my understanding of patient care and the medical profession."
After: "I didn't expect the smell. Antiseptic and instant coffee and something underneath both. That's what changed my mind about medicine — not the procedures, but the smell of the waiting."

WHAT NOT TO DO:
- Do not change WHAT the student is saying — only HOW they say it
- Do not impose a tone that contradicts the essay's overall voice
- Do not make every passage intimate — some moments need distance, some need closeness
- Do not add new content, events, or opinions while shifting tone

ANTI-FABRICATION:
Same content, different register. Never add events, dialogue, or details that don't exist in the original. If shifting to a more intimate tone requires a sensory detail, use [brackets] for anything the student hasn't provided.

OUTPUT GUIDANCE:
Primary = shift tone one notch in the direction that best serves the passage's context (e.g., slightly more intimate, slightly more urgent). Creative = a bolder tonal shift — fully commit to the new register even if it means restructuring sentences. Both must preserve all factual content from the original.`,
  bannedTerms: [
    'delve',
    'tapestry',
    'myriad',
    'multifaceted',
    'journey',
    'passionate',
    'beacon',
    'profound',
    'truly',
    'incredibly',
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
