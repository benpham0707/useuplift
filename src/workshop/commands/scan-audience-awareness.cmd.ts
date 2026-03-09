/**
 * Command: Scan Audience Awareness
 * Family: Meta-Analysis
 *
 * Evaluates how well the essay speaks to its intended reader — typically
 * an admissions officer (AO) reading their 30th essay that day. Diagnoses
 * where the essay loses the reader and why.
 */

import { commandRegistry } from '../registry/commandRegistry';
import { CommandManifest } from '../shared/types';

const manifest: CommandManifest = {
  id: 'scan_audience_awareness',
  family: 'meta',
  displayName: 'Scan Audience Awareness',
  description: 'Evaluate how well the essay speaks to its intended reader (admissions officer).',
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
  ],
  detailedPrompt: `Evaluate how well this essay speaks to its intended reader — an admissions officer (AO) reading their 30th application that day. Diagnose where the essay loses the reader and why.

THE AO READER PROFILE:
- Reading 30-50 essays per day during peak season
- Spending 8-12 minutes per application on first read
- Looking for: authenticity, intellectual vitality, specific detail, self-awareness, fit with institution
- Fatigued by: cliches, generic lessons, name-dropping without depth, essays that could be about anyone
- Persuaded by: a single vivid moment they remember at the end of the day, evidence of genuine reflection, a voice that sounds like a real person

WHAT TO SCAN FOR:

1. **First-paragraph hook strength** (will the AO keep reading or skim?):
   - Does the opening create curiosity or obligation to read on?
   - Would this opening blend into the stack or stand out?

2. **Specificity test** (could another student submit this essay?):
   - Remove the student's name — is there enough specific detail that you'd know whose essay this is?
   - Generic sentences score 0, highly specific ones score 5

3. **"So what?" pressure test**:
   - After each major claim or reflection, would an AO think "interesting, tell me more" or "okay, and?"
   - Flag passages where the AO would mentally check out

4. **Voice authenticity check**:
   - Does this sound like a teenager wrote it, or like an adult edited it?
   - Overly polished prose can signal inauthenticity to experienced readers

5. **Fit signal** (for "Why Us" essays specifically):
   - Does the essay mention specific, non-Googleable details about the school?
   - Could this "Why Us" be sent to three different schools unchanged?

6. **Memorability test**:
   - After reading, what ONE image or detail would the AO remember at dinner?
   - If nothing comes to mind, the essay needs a stronger anchor image

HOW TO PRESENT:
- Score each of the 6 dimensions (1-5 scale)
- Identify the 2 weakest areas with specific passage references
- Suggest which commands would address each weakness

WHAT NOT TO DO:
- Do not rewrite the essay — this is diagnostic only
- Do not assume all essays need to be dramatic — quiet essays can score 5/5 on authenticity
- Do not penalize unconventional structure if it serves the content
- Do not suggest the student manufacture dramatic experiences

ANTI-FABRICATION:
This is a read-only diagnostic command. Never suggest the student add experiences they haven't had. Recommendations should point to existing passages that need strengthening, not new content to fabricate.

OUTPUT GUIDANCE:
Primary = structured diagnostic with scores for each of the 6 dimensions, the 2 biggest weaknesses, and specific command recommendations. Creative = a narrative "AO perspective" — write 2-3 sentences AS the admissions officer, describing their honest reaction to this essay (what grabbed them, where they drifted, what they'd remember). The teachingNote should explain why audience awareness is the most under-taught skill in essay writing.`,
  bannedTerms: [
    'delve',
    'tapestry',
    'myriad',
    'multifaceted',
    'journey',
    'passionate',
    'beacon',
    'holistic',
    'well-rounded',
    'make a difference',
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
