/**
 * Command: Map Emotional Arc
 * Family: Tonal/Emotional (Meta)
 *
 * Analyzes the emotional trajectory of the essay, identifies flat spots
 * where engagement drops, and suggests where to add or reduce intensity.
 * This is a META command — it diagnoses rather than directly edits.
 */

import { commandRegistry } from '../registry/commandRegistry';
import { CommandManifest } from '../shared/types';

const manifest: CommandManifest = {
  id: 'map_emotional_arc',
  family: 'meta',
  displayName: 'Map Emotional Arc',
  description: '(Meta) Analyze emotional trajectory, identify flat spots and intensity mismatches.',
  applicableEssayTypes: [
    'personal_statement',
    'uc_piq',
    'challenge_adversity',
    'identity_background',
    'activity_to_essay',
    'community',
  ],
  detailedPrompt: `Analyze the emotional trajectory of the full essay (or selected passage) and produce a diagnostic map showing where emotional intensity rises, falls, and flatlines.

WHAT TO MAP:
For each paragraph or logical section, assess:
1. **Emotional intensity** (1-5 scale): 1 = neutral/informational, 5 = raw vulnerability or peak tension
2. **Dominant emotion**: curiosity, anxiety, determination, confusion, pride, shame, wonder, grief, relief, joy, frustration, etc.
3. **Arc movement**: rising, falling, flat, or pivoting

WHAT TO DIAGNOSE:
- **Flat spots**: 2+ consecutive sections at the same intensity level — the reader's attention drifts
- **Missing peaks**: the essay never reaches intensity 4-5 — it stays safe and surface-level
- **Front-loaded emotion**: the opening is the most emotional part, then everything deflates
- **Monotone intensity**: every section is at 3-4 with no valleys — intensity without contrast feels numb
- **Unearned resolution**: the ending resolves at low intensity without building to it

IDEAL ARC PATTERNS:
- Hook (3-4) → Context (2) → Build (3) → Peak (5) → Reflection (3-4) → Landing (4)
- The best essays have AT LEAST one valley (intensity 1-2) that makes the peaks feel higher
- Contrast is everything: a moment of quiet makes the next moment of intensity hit harder

HOW TO PRESENT:
- Map each section with: section label, intensity score, dominant emotion, and one-line note
- Identify the 1-2 biggest problems in the arc
- Suggest specific commands to fix each problem (e.g., "Section 3 is flat — use 'expand_moment' or 'deepen_vulnerability' here")

WHAT NOT TO DO:
- Do not rewrite the essay — this is a diagnostic tool
- Do not suggest the student ADD trauma or manufacture emotion
- Do not assume every essay needs a 5-intensity peak — some essays work at 3-4 with brilliant control
- Do not map line-by-line — map by paragraph or logical section

ANTI-FABRICATION:
This command only analyzes existing text. Never suggest adding experiences, emotions, or events the student hasn't written about. Recommendations should point to existing passages that could be deepened, not new content to create.

OUTPUT GUIDANCE:
Return the emotional map as structured data. The "primary" field should contain the diagnostic map and top 2 recommendations. The "creative" field should contain an alternative reading of the arc (e.g., what if the peak is in the wrong place? what if the essay is actually about a different emotion than the student thinks?). The teachingNote should explain why emotional arcs matter for admissions readers.`,
  bannedTerms: [
    'delve',
    'tapestry',
    'myriad',
    'multifaceted',
    'journey',
    'passionate',
    'beacon',
    'roller coaster of emotions',
    'emotional roller coaster',
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
