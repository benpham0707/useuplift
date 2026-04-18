/**
 * Prior Voice Block — Port A2 (Wave-1a)
 *
 * Builds the A2_VOICE_PRIOR block that is injected into L3.75 Phase A's user
 * prompt when a prior StudentVoiceProfile exists for the user. V1 analyzed
 * every essay in isolation — voice data computed for essay #1 was never
 * persisted, so essay #3 evaluated against zero prior context. This port
 * threads the `voiceProfileService` runtime persistence layer into L3.75 as
 * a DESCRIPTIVE PRIOR — not a constraint, not a desired voice, just an
 * observation carried forward from earlier essays.
 *
 * CONTRACT: Purely descriptive. The block is tagged with
 *   // @prompt-block A2_VOICE_PRIOR
 * and declared at level 'descriptive' in PROMPT_BLOCK_DECLARATIONS. The
 * descriptive-contract lint scans the template literal below for the
 * FORBIDDEN_WORDS vocabulary (effective / compelling / masterful / …) and
 * fails the build if any leak in. Author additions in OBSERVATIONAL voice:
 *   GOOD: "register: informal"
 *   BAD:  "register is too informal"  (evaluative framing)
 *   GOOD: "sentence-length variety: high"
 *   BAD:  "excellent sentence-length variety"  (evaluative adjective)
 *
 * DESIGN: The prior is an INPUT to the descriptive L3.75 machinery, not a
 * replacement for it. L3.75 still computes voiceIdentity / voiceMap from the
 * current essay's sentence-level understanding; the prior simply gives it
 * cross-essay context so the same student analyzing a second essay sees
 * their prior voice observations and can compare / deviate / confirm.
 *
 * INJECTION POINT: user prompt (per-request), not system prompt (cached).
 * Rationale:
 *   1. Voice priors are inherently per-user — putting them in the cached
 *      system prompt would fragment the cache across every user anyway.
 *      The system prompt stays hot for all L3.75 calls regardless of user.
 *   2. The Wave-1b.5 block-version seam makes the choice non-load-bearing:
 *      both paths get version markers + lint scanning. User-prompt keeps the
 *      cacheable system prompt truly shared.
 *
 * PERSISTENCE: Writing back after L3.75 is handled in analysisOrchestrator.
 * This module is read-only — it produces the prompt segment.
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md Section 3 (Port A2),
 *      docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md Section 4 Pre-reqs 3+4.
 */

import type { StudentVoiceProfile } from '../../voiceProfile/types';
import { withPromptBlockVersion } from '../../../lib/llm/promptBlockVersions';

// ---------------------------------------------------------------------------
// Block body authoring
// ---------------------------------------------------------------------------
// The descriptive-contract lint binds `// @prompt-block A2_VOICE_PRIOR` to
// the NEXT template literal. Keep the body purely observational. The framing
// sentences at top/bottom ("reference only, not a constraint" / "Observe, do
// not enforce") make clear this is a PRIOR, not a target.

// @prompt-block A2_VOICE_PRIOR
const PRIOR_VOICE_BODY_TEMPLATE = `PRIOR VOICE OBSERVATION (carried forward from earlier essays by this student — reference only, not a constraint):
- register (primary): {{REGISTER_PRIMARY}}{{REGISTER_SECONDARY}}
- vocabulary level: {{VOCABULARY_LEVEL}}
- formality: {{FORMALITY}}
- average sentence length: {{AVG_SENTENCE_LENGTH}} words
- sentence-length variety (1-10 scale): {{SENTENCE_LENGTH_VARIETY}}
- fragment use: {{FRAGMENT_USE}}
- energy level: {{ENERGY}}
- humor frequency: {{HUMOR}}
- directness: {{DIRECTNESS}}
- emotional openness: {{EMOTIONAL_OPENNESS}}{{SIGNATURE_WORDS}}{{AVOID_WORDS}}{{AUTHENTIC_PHRASES}}{{PRESERVATION_NOTES}}
- samples observed so far: {{SAMPLE_COUNT}}

This essay may deviate from the prior. That is context, not a violation. Describe what THIS essay's voice is doing; note alignment or divergence from the prior where it illuminates the current voice. Do not treat the prior as a target.`;

// ---------------------------------------------------------------------------
// Body builder
// ---------------------------------------------------------------------------

/**
 * Render a prior-voice observation block from a persisted StudentVoiceProfile.
 *
 * Returns the block body wrapped with version markers via
 * withPromptBlockVersion. The caller concatenates this into the L3.75 user
 * prompt when a prior profile exists; when the prior is null, the caller
 * omits the block entirely (no "no prior" framing — just absent).
 *
 * Exported separately from the wrapping step so tests can assert on the
 * unwrapped body content without parsing markers.
 */
export function renderPriorVoiceBody(profile: StudentVoiceProfile): string {
  const registerSecondary = profile.register.secondary
    ? ` / ${profile.register.secondary}`
    : '';

  const signatureWords = profile.linguistics.signatureWords.length > 0
    ? `\n- signature words: ${profile.linguistics.signatureWords.slice(0, 8).map(w => `"${w}"`).join(', ')}`
    : '';

  const avoidWords = profile.linguistics.avoidWords.length > 0
    ? `\n- words the student avoids: ${profile.linguistics.avoidWords.slice(0, 8).map(w => `"${w}"`).join(', ')}`
    : '';

  const preservedPhrases = profile.authenticPhrases
    .filter(p => p.preserveExactly)
    .slice(0, 3)
    .map(p => `"${p.phrase}"`);
  const authenticPhrases = preservedPhrases.length > 0
    ? `\n- authentic phrases carried from prior essays: ${preservedPhrases.join(', ')}`
    : '';

  const preservationNotes = profile.preservationWarnings.length > 0
    ? `\n- student-specific preservation notes (prior observations to respect): ${profile.preservationWarnings.slice(0, 3).join('; ')}`
    : '';

  const body = PRIOR_VOICE_BODY_TEMPLATE
    .replace('{{REGISTER_PRIMARY}}', profile.register.primary)
    .replace('{{REGISTER_SECONDARY}}', registerSecondary)
    .replace('{{VOCABULARY_LEVEL}}', profile.linguistics.vocabularyLevel)
    .replace('{{FORMALITY}}', profile.linguistics.formality)
    .replace('{{AVG_SENTENCE_LENGTH}}', String(profile.linguistics.averageSentenceLength))
    .replace('{{SENTENCE_LENGTH_VARIETY}}', String(profile.linguistics.sentenceLengthVariety))
    .replace('{{FRAGMENT_USE}}', profile.linguistics.fragmentUse)
    .replace('{{ENERGY}}', profile.personality.energy)
    .replace('{{HUMOR}}', profile.personality.humor)
    .replace('{{DIRECTNESS}}', profile.personality.directness)
    .replace('{{EMOTIONAL_OPENNESS}}', profile.personality.emotionalOpenness)
    .replace('{{SIGNATURE_WORDS}}', signatureWords)
    .replace('{{AVOID_WORDS}}', avoidWords)
    .replace('{{AUTHENTIC_PHRASES}}', authenticPhrases)
    .replace('{{PRESERVATION_NOTES}}', preservationNotes)
    .replace('{{SAMPLE_COUNT}}', String(profile.sampleCount));

  return body;
}

/**
 * Build the complete, version-wrapped A2_VOICE_PRIOR block for injection into
 * the L3.75 user prompt.
 *
 * Returns an empty string when the prior profile is null — callers should
 * just concatenate the return value unconditionally, which produces the
 * pre-port-identical prompt when no prior exists.
 */
export function buildPriorVoiceBlock(
  profile: StudentVoiceProfile | null | undefined,
): string {
  if (!profile) return '';
  const body = renderPriorVoiceBody(profile);
  return withPromptBlockVersion(body, 'A2_VOICE_PRIOR');
}
