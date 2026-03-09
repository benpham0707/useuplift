/**
 * Command: Thread Metaphor
 * Family: Rhetorical
 *
 * Weaves a metaphor or motif through the essay for thematic cohesion.
 * Identifies an existing image or introduces a subtle one, then threads
 * it across key moments to create resonance.
 */

import { commandRegistry } from '../registry/commandRegistry';
import { CommandManifest } from '../shared/types';

const manifest: CommandManifest = {
  id: 'thread_metaphor',
  family: 'rhetorical',
  displayName: 'Thread Metaphor',
  description: 'Weave a metaphor or motif through the essay for thematic cohesion.',
  applicableEssayTypes: [
    'personal_statement',
    'uc_piq',
    'challenge_adversity',
    'identity_background',
    'activity_to_essay',
    'community',
  ],
  detailedPrompt: `Identify or introduce a metaphor, image, or motif and thread it through the passage to create thematic cohesion and resonance.

HOW METAPHOR THREADING WORKS:
A threaded metaphor appears at least 2-3 times in an essay, each time in a different context that adds new meaning. The reader recognizes the pattern and feels the essay is structurally coherent without being told so.

STEP 1 — FIND THE SEED:
- Look for an image, object, or sensory detail the student has ALREADY used — a locked door, a kitchen table, the sound of a metronome, a specific color
- If no existing image is strong enough, look for an experience that naturally generates one: cooking → heat/ingredients/timing; sports → rhythm/muscle memory/ground; music → tuning/dissonance/harmony
- The best metaphors are CONCRETE OBJECTS from the student's actual life, not abstract concepts

STEP 2 — THREAD IT:
- First appearance: introduce the image literally, as part of the scene
- Second appearance: the image reappears in a different context, now carrying emotional weight
- Third appearance (if applicable): the image returns transformed, showing the student's growth
- The metaphor should never be EXPLAINED — let the reader make the connection

EXAMPLE (motif: the kitchen timer):
First: "Mom set the timer for 45 minutes — the exact length of a tutoring session, she said."
Second: "I started setting my own timer. Not for tutoring, but for the 45 minutes I'd give myself to panic before a test. When it rang, panic time was over."
Third (ending): "The timer on my phone still goes off at 6:15. I don't remember what it was originally for."

WHAT NOT TO DO:
- Do not use dead metaphors ("light at the end of the tunnel", "weight off my shoulders", "roller coaster")
- Do not EXPLAIN the metaphor: "The kitchen timer was a metaphor for..." — if you have to explain it, it's not working
- Do not force a metaphor that doesn't fit the student's experience — it should feel natural
- Do not thread more than ONE metaphor — multiple competing motifs create noise, not resonance
- Do not use the word "metaphor" in the rewrite

ANTI-FABRICATION:
Strongly prefer images and objects the student has ALREADY mentioned. If you introduce a new metaphorical element, it must be a plausible, mundane object from their described experience (not a poetic invention). Use [brackets] for any specific detail you're suggesting they add: "[the sound of the garage door closing]".

OUTPUT GUIDANCE:
Primary = identify the strongest existing image in the passage and show how to echo it once more for resonance. Creative = propose a full 2-3 appearance metaphor thread with specific placement suggestions, using an image from the student's own world. The teachingNote should explain WHY threaded metaphors are powerful for admissions readers (they signal literary control and thematic intention).`,
  bannedTerms: [
    'delve',
    'tapestry',
    'myriad',
    'multifaceted',
    'journey',
    'passionate',
    'beacon',
    'light at the end of the tunnel',
    'roller coaster',
    'weight off my shoulders',
    'mosaic',
    'symphony',
    'kaleidoscope',
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
