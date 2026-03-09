/**
 * Command: Deepen Analysis
 * Family: Analytical
 *
 * Pushes beyond surface-level observation into "so what?" reasoning.
 * Forces the student to articulate WHY something matters, not just WHAT happened.
 */

import { commandRegistry } from '../registry/commandRegistry';
import { CommandManifest } from '../shared/types';

const manifest: CommandManifest = {
  id: 'deepen_analysis',
  family: 'analytical',
  displayName: 'Deepen Analysis',
  description: 'Push beyond surface observation into "so what?" reasoning.',
  applicableEssayTypes: [
    'personal_statement',
    'uc_piq',
    'why_us',
    'challenge_adversity',
    'intellectual_vitality',
    'analytical',
    'activity_to_essay',
    'community',
  ],
  detailedPrompt: `Push the selected passage beyond surface-level observation into deeper "so what?" reasoning. The student has described WHAT happened — now make them explain WHY it matters.

WHAT TO LOOK FOR:
- Narrative without reflection: "I did X, then Y, then Z" — but no analysis of meaning
- Observation without interpretation: "The lab results were unexpected" — but no exploration of implications
- Stopped-short insights: the student starts to analyze ("I realized...") but lands on a generic conclusion
- Missing the second "why": they explain what they learned but not why it mattered to THEM specifically

HOW TO DEEPEN:
- Ask the invisible "so what?" — if a reader could respond "okay, and?", the analysis isn't deep enough
- Push from WHAT to WHY to WHAT NOW: What happened → Why does it matter → How does it change what you do or think going forward?
- Name the SPECIFIC mechanism of change: not "this taught me empathy" but "watching Mrs. Rivera translate for patients who couldn't advocate for themselves showed me that empathy isn't feeling — it's doing the work someone can't do for themselves"
- Connect the specific to something larger WITHOUT making it generic — the insight should still be uniquely theirs

EXAMPLE:
Before: "Working at the food bank showed me that hunger is a real problem in my community."
After: "I used to think hunger was about not having food. But sorting expired donations at the food bank — cans from 2019, cereal with torn boxes — I realized hunger is about what we're willing to give away. The problem isn't scarcity. It's that we donate what we won't eat ourselves."

WHAT NOT TO DO:
- Do not add philosophical generalizations ("In the grand scheme of things...")
- Do not insert analysis the student hasn't earned through their experience
- Do not turn a personal essay into an academic argument — keep the voice personal
- Do not explain the meaning FOR the student — restructure so the meaning emerges from their own details

ANTI-FABRICATION:
Only deepen analysis of events the student has described. Never invent new experiences, statistics, or factual claims to support the analysis. The deeper meaning must emerge from the student's OWN details. Use [brackets] for any specifics you're inferring.

OUTPUT GUIDANCE:
Primary = add one layer of "so what?" analysis to the existing passage, keeping it grounded in the student's details. Creative = restructure the passage so the deeper insight leads and the surface observation supports it — flip the hierarchy from narrative-first to analysis-first.`,
  bannedTerms: [
    'delve',
    'tapestry',
    'myriad',
    'multifaceted',
    'journey',
    'passionate',
    'beacon',
    'in the grand scheme',
    'profound realization',
    'eye-opening',
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
