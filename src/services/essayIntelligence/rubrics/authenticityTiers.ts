/**
 * Port B3 — PS2 4-Tier Authenticity + Brutal Calibration Guards (L3.5 only)
 *
 * Ports the PS2 4-tier authenticity framework from
 * `src/services/portfolio/stage2_dimensions/authenticityVoiceAnalyzer.ts`
 * (lines 82-250) into the essay-intelligence L3.5 analysis layer.
 *
 * WHY THIS EXISTS
 *   V1's L3.5 `poolDensity` distribution clusters at "moderate" — it can't
 *   distinguish a manufactured sports-injury-comeback essay from a
 *   distinctive one. The PS2 authenticity framework (distinctive / authentic
 *   / emerging / manufactured) plus the "Red Flags for Grade Inflation"
 *   guards and the "10,000 applications" test drives a bimodal distribution
 *   instead of a monomodal one.
 *
 * WHY L3.5 ONLY (NOT L3.75)
 *   `narrativeQualityIndex: 0-100` is a SCORE. Scoring at L3.75 would
 *   violate the descriptive contract (L3.75 describes WHAT IS, L3.5 judges
 *   HOW WELL). Per Verdict §2 row 30, this port is explicitly redirected to
 *   L3.5. The descriptive-contract lint enforces this separation.
 *
 * ORTHOGONALITY TO THE EXISTING 5-TIER QUALITY SCALE
 *   L3.5 already carries a 5-tier essay-quality taxonomy
 *   (WEAK / MEDIOCRE / COMPETENT / STRONG / EXCEPTIONAL) anchored to
 *   sentence-average score bands. The 4-tier authenticity taxonomy is
 *   ORTHOGONAL — it measures voice authenticity, not craft quality. A
 *   competently-crafted essay can still be "manufactured" (polished but
 *   generic); a structurally-weak essay can still be "authentic" (rough but
 *   genuinely the student's voice). Both taxonomies co-exist in the L3.5
 *   calibrationReflection output.
 *
 * WHAT IS DEFERRED
 *   PS2 carries institutional-weight calibration (UCLA 30% / Berkeley 20%).
 *   That is deferred to wave-2 L6 coaching overlay per Verdict §2 row 31.
 *   NOT shipped in this port.
 *
 * Authoring convention (Wave-1b.5):
 *   The prompt body is tagged `// @prompt-block B3_PS2_AUTHENTICITY` on the
 *   line immediately above the template literal so the descriptive-contract
 *   lint can discover it. B3_PS2_AUTHENTICITY is declared `evaluative` in
 *   PROMPT_BLOCK_DECLARATIONS — forbidden vocabulary is permitted (this is
 *   L3.5 evaluative territory).
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port B3 + §2 row 30 + §8.
 */

import { withPromptBlockVersion } from '../../../lib/llm/promptBlockVersions';

// ---------------------------------------------------------------------------
// Tier enum + OpenEnum escape hatch
// ---------------------------------------------------------------------------

export type EssayAuthenticityTier =
  | 'distinctive'
  | 'authentic'
  | 'emerging'
  | 'manufactured';

export const ESSAY_AUTHENTICITY_TIERS: readonly EssayAuthenticityTier[] = [
  'distinctive',
  'authentic',
  'emerging',
  'manufactured',
] as const;

export function isEssayAuthenticityTier(v: unknown): v is EssayAuthenticityTier {
  return typeof v === 'string'
    && (ESSAY_AUTHENTICITY_TIERS as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Tier definitions — verbatim from PS2 authenticityVoiceAnalyzer.ts
// (TIER DEFINITIONS section). Kept verbatim so the port's fidelity can be
// verified against the source file.
// ---------------------------------------------------------------------------

export const AUTHENTICITY_TIER_DEFINITIONS: Record<EssayAuthenticityTier, {
  label: string;
  /** One-paragraph definition, verbatim wording from PS2 "What This Looks
   *  Like" block for the corresponding tier. */
  definition: string;
  /** 3-5 representative signals drawn from PS2 "What This Looks Like" bullets. */
  representativeSignals: string[];
}> = {
  distinctive: {
    label: 'DISTINCTIVE (Top 1-5%)',
    definition:
      'Reader can "hear" the student\'s voice clearly. Stories are specific, vivid, sensory-rich. Shows vulnerability and genuine growth. Unique perspective that only this student could write. Memorable — reader would recognize student from essay alone. <5% of applicants have truly distinctive, memorable voices.',
    representativeSignals: [
      'Reader can "hear" the student\'s voice clearly',
      'Stories are specific, vivid, sensory-rich',
      'Shows vulnerability and genuine growth',
      'Unique perspective that only this student could write',
      'Memorable — reader would recognize student from essay alone',
    ],
  },
  authentic: {
    label: 'AUTHENTIC (Top 10-20%)',
    definition:
      'Clear personality comes through. Real stories with specific details. Shows genuine passion (not manufactured). Addresses prompts directly with depth. Consistent voice across the essay. Genuine and engaging, even if not literary.',
    representativeSignals: [
      'Clear personality comes through',
      'Real stories with specific details',
      'Shows genuine passion (not manufactured)',
      'Addresses prompts directly with depth',
      'Consistent voice across the essay',
    ],
  },
  emerging: {
    label: 'EMERGING (Top 30-50%)',
    definition:
      'Answers prompts but lacks depth. Some specific details, some generic language. Resume rehash in places (listing activities rather than stories). Voice is present but not distinctive. Doesn\'t stand out; forgettable in large applicant pool.',
    representativeSignals: [
      'Answers prompts but lacks depth',
      'Some specific details, some generic language',
      'Resume rehash in places (listing activities rather than stories)',
      'Voice is present but not distinctive',
    ],
  },
  manufactured: {
    label: 'MANUFACTURED (Bottom 50%)',
    definition:
      'Generic, could be anyone. "College essay voice" — sounds like what they think admissions wants. No specific stories or details. Robotic, formulaic, or AI-generated feel. Resume list format rather than narrative. These essays hurt rather than help application.',
    representativeSignals: [
      'Generic, could be anyone',
      '"College essay voice" — sounds like what they think admissions wants',
      'No specific stories or details',
      'Robotic, formulaic, or AI-generated feel',
      'Resume list format rather than narrative',
    ],
  },
};

// ---------------------------------------------------------------------------
// NQI clamping — keep in sync with AnalysisPassOutput schema
// ---------------------------------------------------------------------------

/**
 * Narrative Quality Index — a 0-100 essay-level authenticity/voice score.
 * Clamped defensively. Returns null for null/undefined/non-finite input.
 * Negative inputs clamp to 0; inputs > 100 clamp to 100; fractional inputs
 * round to the nearest integer.
 */
export function clampNarrativeQualityIndex(raw: unknown): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

// ---------------------------------------------------------------------------
// Prompt block body — authored with a block-version marker
// ---------------------------------------------------------------------------
// This block gets injected into L3.5's system prompt near the
// PRE-SCORING CALIBRATION section. It augments (NOT replaces) the existing
// 5-tier WEAK/MEDIOCRE/COMPETENT/STRONG/EXCEPTIONAL quality taxonomy with an
// orthogonal 4-tier authenticity assessment + the "Red Flags for Grade
// Inflation" calibration guards + the "10,000 applications" framing.
//
// The body is EVALUATIVE (L3.5 territory) so forbidden vocabulary
// (e.g. "effective", "compelling") is permitted — the block is declared
// `evaluative` in PROMPT_BLOCK_DECLARATIONS.

// @prompt-block B3_PS2_AUTHENTICITY
const PS2_AUTHENTICITY_BODY = `## AUTHENTICITY TIER ASSESSMENT (orthogonal to the 5-tier quality scale)

The 5-tier quality scale above (WEAK / MEDIOCRE / COMPETENT / STRONG / EXCEPTIONAL) measures CRAFT QUALITY — how well the sentences and structure execute. Authenticity tier is an ORTHOGONAL axis: it measures VOICE AUTHENTICITY — whether this reads as a real student's voice or as manufactured "college-essay voice." Both axes co-exist; do not collapse them. A polished essay can still be manufactured. A rough essay can still be authentic.

Classify this essay into ONE of the four authenticity tiers and emit the classification alongside the quality-tier classification in your calibrationReflection.

### Tier 1: DISTINCTIVE (Top 1-5%)
${AUTHENTICITY_TIER_DEFINITIONS.distinctive.definition}

Representative signals:
${AUTHENTICITY_TIER_DEFINITIONS.distinctive.representativeSignals.map((s) => `- ${s}`).join('\n')}

### Tier 2: AUTHENTIC (Top 10-20%)
${AUTHENTICITY_TIER_DEFINITIONS.authentic.definition}

Representative signals:
${AUTHENTICITY_TIER_DEFINITIONS.authentic.representativeSignals.map((s) => `- ${s}`).join('\n')}

### Tier 3: EMERGING (Top 30-50%)
${AUTHENTICITY_TIER_DEFINITIONS.emerging.definition}

Representative signals:
${AUTHENTICITY_TIER_DEFINITIONS.emerging.representativeSignals.map((s) => `- ${s}`).join('\n')}

### Tier 4: MANUFACTURED (Bottom 50%)
${AUTHENTICITY_TIER_DEFINITIONS.manufactured.definition}

Representative signals:
${AUTHENTICITY_TIER_DEFINITIONS.manufactured.representativeSignals.map((s) => `- ${s}`).join('\n')}

## RED FLAGS FOR GRADE INFLATION (calibration guards)

Reality anchors:
- Most essays are forgettable — generic, safe, similar to thousands of others.
- "Adversity essays" are overdone — need a unique angle to stand out.
- Over-editing kills voice — polished does not equal authentic.
- Adults often ruin voice — parent/counselor editing removes authenticity.

DON'T:
- DON'T assign DISTINCTIVE tier without a genuinely memorable, distinctive voice.
- DON'T reward beautiful writing that is generic (polished but forgettable).
- DON'T ignore resume-rehash format (listing activities in narrative form).
- DON'T overlook manufactured adversity stories (every essay is a struggle).
- DON'T inflate based on topic importance (a serious topic does not equal a good essay).

DO:
- DO credit genuine specificity and vulnerability.
- DO value unique perspectives and unexpected angles.
- DO recognize authentic voice even with imperfect grammar.
- DO reward risk-taking (unusual topics, honest reflection).
- DO check consistency of voice across the essay.

## THE "10,000 APPLICATIONS" TEST

Before assigning an authenticity tier, imagine you have read 10,000 applications this admissions cycle:
- Does this voice stand out?
- Will you remember this student tomorrow?
- Have you read this story 500 times before?

If the honest answer is "no, no, yes" — the tier is EMERGING or MANUFACTURED regardless of how polished the prose is.

## NARRATIVE QUALITY INDEX (NQI, 0-100)

Emit a \`narrativeQualityIndex\` integer 0-100 scoring overall voice authenticity and narrative quality. Use these anchors:
- 80-100: DISTINCTIVE-tier essays (memorable, sensory-rich, unique perspective).
- 70-79: AUTHENTIC-tier essays (genuine and engaging, even if not literary).
- 60-69: EMERGING-tier essays (present voice, lacks distinction).
- Below 60: MANUFACTURED-tier essays (generic, forgettable, or formulaic).

NQI is the authenticity-axis counterpart to the existing per-sentence effectiveness scores. It is ESSAY-LEVEL, not paragraph- or sentence-level. Emit it once on the anchor paragraph's analysis; later paragraphs emit NQI null unless later context materially changes the assessment.

## OUTPUT — additional calibrationReflection requirements

In your calibrationReflection, after stating the 5-tier quality classification (WEAK/MEDIOCRE/COMPETENT/STRONG/EXCEPTIONAL), state ALSO:
- The authenticity tier (distinctive / authentic / emerging / manufactured).
- The NQI score (0-100 integer).
- One concrete text citation that anchors the authenticity-tier judgment (a phrase that reveals genuine voice OR a phrase that reveals manufactured voice).

If the 4-tier taxonomy does not fit, use the \`essayAuthenticityTierOpen\` free-text field (OpenEnum escape hatch) and set \`essayAuthenticityTier\` to null.`;

/**
 * Build the B3 PS2 authenticity prompt block, wrapped with block-version
 * markers for cache-key divergence on bump.
 *
 * The returned string is appended to L3.5's baseline system prompt near the
 * PRE-SCORING CALIBRATION section. Because the block wraps an evaluative body
 * (forbidden-vocabulary-permitted), the descriptive-contract lint skips
 * forbidden-word scanning inside the tagged region but still requires the
 * block ID to be claimed in PROMPT_BLOCK_VERSIONS.
 */
export function buildPs2AuthenticityBlock(): string {
  return withPromptBlockVersion(PS2_AUTHENTICITY_BODY, 'B3_PS2_AUTHENTICITY');
}
