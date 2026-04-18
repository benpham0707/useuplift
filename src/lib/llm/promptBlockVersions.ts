/**
 * Wave-1b.5 — Block-Versioned Composable Prompts
 *
 * Extends the Wave-1b Pre-req 3 infrastructure (SYSTEM_PROMPT_VERSION) from
 * file-level to block-level granularity so Wave-1 knowledge-absorption ports
 * (A1/A2/A3, B1/B2/B3, F1/F2, G1/G2/G3) can:
 *
 *   1. Ship in parallel without merge-order dependency on a single global
 *      SYSTEM_PROMPT_VERSION bump.
 *   2. Get cache-key divergence when a block's content edits (bumping
 *      its slot in PROMPT_BLOCK_VERSIONS invalidates just that block's
 *      slice of the Anthropic cache — the rest of the system prompt stays
 *      cached).
 *   3. Participate in the descriptive-contract lint regardless of which
 *      file the block's content is authored in (the lint scans block-tagged
 *      regions anywhere under src/services/, not only L1/L3/L3.75 files).
 *
 * USAGE — authoring a block-tagged prompt region:
 *
 *     import { withPromptBlockVersion } from '@/lib/llm/promptBlockVersions';
 *
 *     // @prompt-block A2_VOICE_PRIOR
 *     const priorVoiceBody = (profile: StudentVoiceProfile) => `
 *       PRIOR OBSERVATION (from earlier essays):
 *       register: ${profile.register.primary}
 *       ...`;
 *
 *     // At request time:
 *     const wrapped = withPromptBlockVersion(priorVoiceBody(profile), 'A2_VOICE_PRIOR');
 *
 * The `// @prompt-block <ID>` comment binds the NEXT template literal in
 * source to the block slot. The descriptive-contract lint reads the
 * comment, looks up the declared level in PROMPT_BLOCK_DECLARATIONS, and
 * scans the template literal's lines for forbidden vocabulary when the
 * level is 'descriptive'. Unknown IDs are lint failures (a block was
 * authored without claiming a slot in the manifest above).
 *
 * The helper wraps the body with HTML-comment markers:
 *
 *     <!-- BLOCK:A2_VOICE_PRIOR@v1.0.0 -->
 *     <body>
 *     <!-- /BLOCK:A2_VOICE_PRIOR -->
 *
 * Anthropic's prompt-cache keys by literal text, so the version marker
 * inside a cached region automatically produces a cache miss on bump.
 * The closing marker is version-less so the regex-based lint can match
 * open/close reliably without tracking depth.
 *
 * DECLARATION vs USAGE: PROMPT_BLOCK_VERSIONS is the version registry;
 * PROMPT_BLOCK_DECLARATIONS maps each block to its descriptive-contract
 * level (descriptive | evaluative | prescriptive). The lint reads the
 * declaration to decide whether forbidden-vocabulary scanning applies
 * inside that block's tagged regions.
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md Section 4 Pre-req 3 + 4.
 */

// ---------------------------------------------------------------------------
// Block registry — pre-claimed slots
// ---------------------------------------------------------------------------
// Every Wave-1 port that injects a named prompt block claims a slot here
// BEFORE the port's PR opens. Bumping a slot means the block's content
// changed in a way that warrants a cache cut. Slots are independent: an A2
// bump does not force A1 / A3 to rebase.
//
// Versions follow semver-lite: vMAJOR.MINOR.PATCH. Bump MINOR for content
// edits that preserve the block's meaning; bump MAJOR for a prompt-shape
// change that downstream consumers may need to adapt to.

export const PROMPT_BLOCK_VERSIONS = {
  // Wave-1a
  A1_COACHING_GUARDRAILS: 'v1.0.0',
  A2_VOICE_PRIOR:         'v1.0.0',
  A3_PIQ_RUBRIC:          'v1.0.0',

  // Wave-1c (seam-dependent)
  B1_PATTERN_LIBRARY:     'v1.0.0',
  B2_SYMPTOM_TAXONOMY:    'v1.0.0',
  B3_PS2_AUTHENTICITY:    'v1.0.0',

  // Fillers
  F1_CLICHE_ANCHORS:      'v1.0.0',
  F2_AI_RISK_SIGNAL:      'v1.0.0',

  // Promoted-from-gap-hunter
  G1_FABRICATION_GUARD:   'v1.0.0',
  G2_FOCUS_MODE:          'v1.0.0',
  G3_FEW_SHOT_CALIBRATION:'v1.0.0',
} as const;

export type PromptBlockId = keyof typeof PROMPT_BLOCK_VERSIONS;

// ---------------------------------------------------------------------------
// Descriptive-contract level declaration
// ---------------------------------------------------------------------------
// Every block declares the contract level its content must honor:
//
//   • descriptive — describes WHAT IS, never WHAT TO DO or HOW WELL. This is
//     the L1 / L3 / L3.75 substrate. The lint scans these blocks for
//     evaluative vocabulary (same FORBIDDEN_WORDS list as the file-level
//     L1/L3/L3.75 scan).
//
//   • evaluative — judges quality (L3.5 / L4 territory). Forbidden vocab is
//     permitted; the lint skips these blocks.
//
//   • prescriptive — tells the student what to do (L5 / L6 territory).
//     Forbidden vocab is permitted; the lint skips these blocks.
//
// If a block straddles layers (e.g., a shared rubric catalog used by both
// L3.5 and L6) authors should split it into two block slots with distinct
// IDs and distinct levels rather than declare the more permissive one.

export type ContractLevel = 'descriptive' | 'evaluative' | 'prescriptive';

export const PROMPT_BLOCK_DECLARATIONS: Record<PromptBlockId, {
  level: ContractLevel;
  /** Short human-readable note explaining the block's purpose. */
  note: string;
}> = {
  // Wave-1a
  A1_COACHING_GUARDRAILS: {
    level: 'prescriptive',
    note: 'PIQ coaching guardrails — good/bad sensory pairs, VFP, QAP, 5-step, UC values. L6.',
  },
  A2_VOICE_PRIOR: {
    level: 'descriptive',
    note: 'Prior voice-profile observation injected into L3.75 Phase A preamble.',
  },
  A3_PIQ_RUBRIC: {
    level: 'evaluative',
    note: 'PIQ 13-dimension rubric activation block. L3.5 + L4 gated on essayType === "piq".',
  },

  // Wave-1c
  B1_PATTERN_LIBRARY: {
    level: 'evaluative',
    note: 'Known-pattern catalog reference block for L3.5 (PIQ 41-pattern + Common App 28-pattern).',
  },
  B2_SYMPTOM_TAXONOMY: {
    level: 'evaluative',
    note: 'SymptomDiagnoser 29-type one-line definitions for L3.5 weaknesses emission.',
  },
  B3_PS2_AUTHENTICITY: {
    level: 'evaluative',
    note: 'PS2 4-tier authenticity + brutal calibration guards at L3.5 calibrationReflection.',
  },

  // Fillers
  F1_CLICHE_ANCHORS: {
    level: 'evaluative',
    note: 'Cliché anchor examples extending L3.5 SCORE-38 / SCORE-52 bands.',
  },
  F2_AI_RISK_SIGNAL: {
    level: 'descriptive',
    note: 'aiRiskScorer prior injected into L3.75 INTENTIONALITY CALIBRATION as diagnostic prior.',
  },

  // Promoted-from-gap-hunter
  G1_FABRICATION_GUARD: {
    level: 'prescriptive',
    note: 'Fabricated-metrics anti-fabrication final-check across all generative prompts. Safety P0.',
  },
  G2_FOCUS_MODE: {
    level: 'prescriptive',
    note: 'L5 Focus Mode 2-3 focus areas max per session.',
  },
  G3_FEW_SHOT_CALIBRATION: {
    level: 'evaluative',
    note: 'Few-shot calibration example sets attached to scoring prompts.',
  },
};

// ---------------------------------------------------------------------------
// Helper — wrap a body with block-version markers
// ---------------------------------------------------------------------------
// The open marker carries the version (for cache-key divergence on bump);
// the close marker is version-less so structural lint / audit tooling can
// match open/close pairs cheaply with a single regex.
//
// Idempotent: if the body already opens with a BLOCK marker for the same
// blockId, it is stripped and re-applied with the current version. This
// lets callers re-wrap defensively without accumulating nested markers.

export const BLOCK_OPEN_RE = /<!--\s*BLOCK:([A-Z0-9_]+)@(v\d+\.\d+\.\d+)\s*-->/;
export const BLOCK_CLOSE_RE = /<!--\s*\/BLOCK:([A-Z0-9_]+)\s*-->/;

export function withPromptBlockVersion(
  body: string,
  blockId: PromptBlockId,
  version?: string,
): string {
  const v = version ?? PROMPT_BLOCK_VERSIONS[blockId];

  // Strip an existing matching open marker + trailing newline, if present.
  const openMatch = body.match(BLOCK_OPEN_RE);
  let stripped = body;
  if (openMatch && openMatch[1] === blockId) {
    stripped = stripped.replace(BLOCK_OPEN_RE, '').replace(/^\n/, '');
    // Also strip the matching close marker if it is present at the tail.
    const closeRe = new RegExp(`\\n?<!--\\s*/BLOCK:${blockId}\\s*-->\\s*$`);
    stripped = stripped.replace(closeRe, '');
  }

  return `<!-- BLOCK:${blockId}@${v} -->\n${stripped}\n<!-- /BLOCK:${blockId} -->`;
}

/**
 * Look up a block's declared contract level. Used by the lint.
 */
export function getBlockContractLevel(blockId: PromptBlockId): ContractLevel {
  return PROMPT_BLOCK_DECLARATIONS[blockId].level;
}

/**
 * Runtime guard: is this string a known PromptBlockId? Used by the lint
 * when walking arbitrary source files — unknown block IDs produce a lint
 * failure (they indicate a block was authored without claiming a slot).
 */
export function isKnownBlockId(id: string): id is PromptBlockId {
  return Object.prototype.hasOwnProperty.call(PROMPT_BLOCK_VERSIONS, id);
}
