/**
 * Command: Sharpen Claim
 * Family: Analytical
 *
 * Identifies the core argument or thesis in a passage and makes it
 * more precise, specific, and defensible.
 */

import { commandRegistry } from '../registry/commandRegistry';
import { CommandManifest } from '../shared/types';

const manifest: CommandManifest = {
  id: 'sharpen_claim',
  family: 'analytical',
  displayName: 'Sharpen Claim',
  description: 'Identify the core argument or thesis and make it more precise and defensible.',
  applicableEssayTypes: [
    'personal_statement',
    'why_us',
    'intellectual_vitality',
    'analytical',
    'activity_to_essay',
  ],
  detailedPrompt: `Identify the core claim or thesis in the selected passage and rewrite it to be more precise, specific, and defensible.

WHAT TO LOOK FOR:
- Vague thesis statements: "I learned a lot", "It was important to me", "This changed my perspective"
- Overclaiming: assertions too broad to support ("I am the most dedicated person on the team")
- Buried claims: the real argument is hiding inside a paragraph of setup
- Hedged-to-nothing claims: so many qualifiers ("sort of", "in a way", "I think maybe") that the point evaporates

HOW TO FIX:
- Extract the ONE core assertion the student is making — name it explicitly
- Make it SPECIFIC: replace "I learned about leadership" with "I learned that leadership means making the unpopular call when your team wants the easy path"
- Make it DEFENSIBLE: the rest of the essay should be able to support this claim with evidence
- Make it SURPRISING: if the claim could appear in any student's essay unchanged, it's too generic
- Keep it ONE sentence — a sharp claim doesn't need a paragraph

EXAMPLE:
Before: "This experience really taught me a lot about what it means to work with others and be a good team player."
After: "I discovered that being a good teammate sometimes means staying quiet — letting someone else's worse idea play out so they learn to trust their own judgment."

WHAT NOT TO DO:
- Do not change the student's core MESSAGE — only sharpen how they express it
- Do not add claims the student hasn't implied
- Do not make the claim so narrow it no longer represents the essay's argument
- Do not use academic jargon — this is a personal essay, not a research paper

ANTI-FABRICATION:
Only sharpen claims the student has already made. Never introduce new arguments, positions, or opinions. If the passage has no identifiable claim, note this in the teachingNote and suggest where one could be inserted.

OUTPUT GUIDANCE:
Primary = tighten the existing claim — same idea, fewer words, more precision. Creative = reframe the claim from a more surprising or counterintuitive angle that the essay's evidence still supports.`,
  bannedTerms: [
    'delve',
    'tapestry',
    'myriad',
    'multifaceted',
    'journey',
    'passionate',
    'beacon',
    'profound impact',
    'transformative experience',
    'testament to',
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
