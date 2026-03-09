/**
 * Command: Add Counterpoint
 * Family: Analytical
 *
 * Introduces nuance by acknowledging complexity, opposing perspectives,
 * or internal contradictions that make the argument more honest and mature.
 */

import { commandRegistry } from '../registry/commandRegistry';
import { CommandManifest } from '../shared/types';

const manifest: CommandManifest = {
  id: 'add_counterpoint',
  family: 'analytical',
  displayName: 'Add Counterpoint',
  description: 'Introduce nuance by acknowledging complexity or opposing perspectives.',
  applicableEssayTypes: [
    'personal_statement',
    'why_us',
    'challenge_adversity',
    'intellectual_vitality',
    'analytical',
    'community',
  ],
  detailedPrompt: `Add intellectual nuance by acknowledging a counterpoint, complication, or internal contradiction that makes the argument more honest and mature.

WHAT TO LOOK FOR:
- One-sided arguments: "Volunteering is the most rewarding thing a person can do" — no acknowledgment of complexity
- Binary thinking: "Before I was X, after I was Y" — no recognition that growth is messy
- Missing self-awareness: the student claims growth but doesn't name what they still struggle with
- Oversimplified conclusions: "And that's when I realized hard work always pays off"

HOW TO ADD NUANCE:
- Name what complicates the claim: "But I also know that..." or "What I didn't expect was..."
- Acknowledge internal contradiction: "Part of me still wanted to quit — and I don't think that part was wrong"
- Concede limits: "I can't pretend this solved everything" or "The truth is more complicated"
- Use the "yes, and" or "yes, but" structure: affirm the core claim, then add the complication
- One sentence of counterpoint is enough — don't derail the essay

EXAMPLE:
Before: "Leading the team taught me that if you believe in yourself, anything is possible."
After: "Leading the team taught me that belief matters — but so does admitting when you're wrong. I believed in the timeline I set, and it was two weeks too aggressive. The project worked because I eventually listened, not because I was confident."

WHAT NOT TO DO:
- Do not undermine the student's core argument — add nuance, don't negate
- Do not introduce a counterpoint so strong it makes the student seem confused
- Do not add generic disclaimers ("of course, nothing is perfect")
- Do not lecture about complexity — SHOW it through a specific detail or admission

ANTI-FABRICATION:
Only add counterpoints implied by the student's own experience. If the student describes leading a team, you can note the difficulty of leadership. But do not invent failures, conflicts, or doubts the student hasn't hinted at. Use [brackets] for any specific detail you're inferring.

OUTPUT GUIDANCE:
Primary = add one sentence of honest nuance that complicates the main claim without weakening it. Creative = restructure the passage so the counterpoint becomes a structural feature — the argument is STRONGER because it acknowledges the complication.`,
  bannedTerms: [
    'delve',
    'tapestry',
    'myriad',
    'multifaceted',
    'journey',
    'passionate',
    'beacon',
    'on the other hand',
    'however it is important to note',
    'while some may argue',
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
