/**
 * Command: Improve Transition
 * Family: Structural
 *
 * Strengthens connections between paragraphs and ideas. Replaces
 * mechanical transition words with organic bridges that carry meaning.
 */

import { commandRegistry } from '../registry/commandRegistry';
import { CommandManifest } from '../shared/types';

const manifest: CommandManifest = {
  id: 'improve_transition',
  family: 'structural',
  displayName: 'Improve Transition',
  description: 'Strengthen connections between paragraphs and ideas with organic bridges.',
  applicableEssayTypes: [
    'personal_statement',
    'uc_piq',
    'why_us',
    'challenge_adversity',
    'intellectual_vitality',
    'activity_to_essay',
    'identity_background',
    'analytical',
    'community',
    'other',
  ],
  detailedPrompt: `Strengthen the transition between paragraphs or ideas by replacing mechanical connectors with organic bridges that carry meaning forward.

WHAT TO LOOK FOR:
- **Mechanical transitions**: "Furthermore,", "Additionally,", "Moreover,", "In addition," — these are traffic signs, not bridges
- **Topic jumps**: one paragraph ends on topic A, the next starts on topic B with no connection
- **Chronological crutches**: "Then,", "Next,", "After that,", "Later," — the essay reads like a timeline, not a story
- **Missing logical links**: the student assumes the reader sees the connection between ideas, but doesn't show it
- **Redundant transitions**: restating what was just said before moving on ("As I mentioned above...")

TECHNIQUES FOR ORGANIC TRANSITIONS:
1. **Echo bridge**: end paragraph A with an image or word, start paragraph B by echoing it. "...the lab door clicked shut behind me." → "That click followed me home."
2. **Contrast pivot**: use the end of one idea to set up its opposite. "I thought I understood patience." → "Then I met the third-graders."
3. **Question bridge**: end with an implicit question that the next paragraph answers. "I didn't know what would happen next." → Next paragraph shows what happened.
4. **Thematic thread**: a recurring image, object, or phrase that stitches paragraphs together. The same object appears in different contexts.
5. **Temporal compression**: skip the boring transition entirely. "Tuesday morning, I sat in AP Chem. By Thursday, I was on a plane."

EXAMPLE:
Before: "Furthermore, another important experience I had was volunteering at the clinic."
After: "The clinic smelled like the hospital where my grandmother spent her last week — antiseptic and artificial calm. I didn't expect that."

WHAT NOT TO DO:
- Do not add "Furthermore", "Moreover", "Additionally", "In conclusion", or any mechanical connector
- Do not create a transition that's longer than the content it connects
- Do not force a connection that isn't there — if two sections are genuinely unrelated, the problem is structure, not transitions
- Do not add new narrative content to build a bridge — use what's already in the essay

ANTI-FABRICATION:
Transitions must be built from material already in the essay — images, themes, objects, emotions the student has mentioned. Never invent a new scene or detail to serve as a bridge. Use [brackets] if you need to reference a specific detail the student would need to confirm.

OUTPUT GUIDANCE:
Primary = replace the mechanical transition with an echo bridge or contrast pivot using existing essay material. Creative = restructure the junction between paragraphs so the transition is invisible — the reader flows from one idea to the next without noticing the seam.`,
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
    'additionally',
    'in addition',
    'in conclusion',
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
