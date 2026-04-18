/**
 * Port B1 — Issue Pattern Index (PIQ 40 + Common App 35)
 *
 * Reshaped per Verdict §3 Port B1 + §5 Row 2 rejection:
 *   - R&D-workshop libraries contain ~75 named failure patterns with full
 *     problemTemplate / whyMattersTemplate / fixStrategies. Injecting those
 *     full records into L3.5 is forbidden (Rule 4 bloat: ~15K cache tokens
 *     of prescriptive templates in an evaluative-level prompt).
 *   - Injecting the full list as regex-matched trigger strings is also
 *     forbidden (Rule 4: deterministic matching replaces LLM judgment).
 *
 * Instead we expose a COMPACT PATTERN INDEX — pattern id + dimension +
 * severity + one-line semantic trigger (≤80 chars, NOT a regex) — and feed
 * the top 15 per essayType into L3.5 as a reference catalog (~900 tokens
 * cached). The L3.5 prompt instructs Sonnet to emit `patternId` + quoted
 * evidence when it recognizes a pattern, or `open: "free-text"` when none
 * of the library entries fit. Full fix templates resolve server-side at
 * L5 via `patternId → source-library lookup`.
 *
 * Namespacing (mandatory): every pattern ID in this index is prefixed with
 * its essayType — `piq:*`, `common_app:*`. Source library IDs that were
 * not namespaced have been rewritten on port.
 *
 * DATA-ONLY MODULE: this file exports metadata + helper. No prompt-block
 * tag here — the block-tagged content lives in analysisPass.ts where
 * `buildPatternCatalogBlock()` is authored.
 *
 * Ref: docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md §3 Port B1 + §8 preservation
 * checklist + §5 Row 2 (regex cliché library rejection).
 */

import type { EssayType } from '../profileTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PatternSeverity = 'critical' | 'major' | 'minor';

/** Essay types a pattern applies to. 'supplement' currently re-uses the
 *  Common App pool (the 35 patterns in `issueDetectionPatterns.ts` cover
 *  supplement types via `relevant_types`). Future: dedicated supplement
 *  patterns can be appended without schema change. */
export type PatternEssayType = 'piq' | 'common_app' | 'supplement';

/**
 * Compact summary of an R&D-library pattern. Whole-library fields
 * (problemTemplate, whyMattersTemplate, fixStrategies, detection_phrases,
 * detection_patterns) INTENTIONALLY ABSENT — those stay in the source
 * library and are resolved at L5 via `patternId` lookup.
 */
export interface PatternSummary {
  /** Namespaced pattern ID. Format: `<essayType>:<source-id-kebab>`. */
  id: string;
  /** Rubric dimension this pattern triggers on. Free-text for Common App
   *  (multi-dimensional); single dim key for PIQ. */
  dimension: string;
  /** Severity from the source library. */
  severity: PatternSeverity;
  /** ≤80-char semantic cue an LLM uses to recognize the pattern. NOT a
   *  regex, NOT a substring match — a prose summary Sonnet reasons over. */
  oneLineTrigger: string;
  /** Which essay-type paths render this pattern in the L3.5 catalog. */
  sourceEssayTypes: PatternEssayType[];
}

// ---------------------------------------------------------------------------
// PIQ 40 patterns — ported from src/services/piq/issuePatterns.ts
// ---------------------------------------------------------------------------
// Severity + dimension lifted verbatim; oneLineTrigger is authored per-pattern
// from problemTemplate. customCheck callbacks (e.g. 'check_hook_type_basic')
// are intentionally NOT ported — identifier strings with no wired consumer
// (dead-code per adversarial audit §1).

const PIQ_PATTERNS: readonly PatternSummary[] = [
  // HOOK ISSUES (4)
  {
    id: 'piq:hook-weak-generic',
    dimension: 'opening_hook_quality',
    severity: 'critical',
    oneLineTrigger: 'Opening is a generic statement ("As president of...", "I have always...") with no tension.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:hook-missing-stakes',
    dimension: 'opening_hook_quality',
    severity: 'critical',
    oneLineTrigger: 'Opening creates interest but fails to establish what is at risk or why the moment matters.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:hook-disconnected-from-body',
    dimension: 'opening_hook_quality',
    severity: 'major',
    oneLineTrigger: 'Hook and essay body feel like separate elements — jarring shift after the opening.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:hook-no-sensory-details',
    dimension: 'opening_hook_quality',
    severity: 'minor',
    oneLineTrigger: 'Opening relies on abstract/summary statements instead of sensory, physical details.',
    sourceEssayTypes: ['piq'],
  },

  // VULNERABILITY ISSUES (5)
  {
    id: 'piq:vuln-level-1-minimal',
    dimension: 'vulnerability_authenticity',
    severity: 'critical',
    oneLineTrigger: 'Challenges acknowledged in generic terms — "it was difficult but I persevered" — no specific failures.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:vuln-manufactured-phrases',
    dimension: 'vulnerability_authenticity',
    severity: 'critical',
    oneLineTrigger: 'Talking ABOUT vulnerability ("vulnerability is a strength") instead of SHOWING it.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:vuln-defensive-retreat',
    dimension: 'vulnerability_authenticity',
    severity: 'major',
    oneLineTrigger: 'Opens in vulnerability, then retreats to safety with redemptive language ("but I learned", "made me stronger").',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:vuln-no-specific-failure',
    dimension: 'vulnerability_authenticity',
    severity: 'critical',
    oneLineTrigger: 'References difficulties in general terms without a single concrete moment of failing or messing up.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:vuln-transformation-imposed',
    dimension: 'vulnerability_authenticity',
    severity: 'major',
    oneLineTrigger: 'Transformation feels too neat or externally imposed — real change is gradual and messy.',
    sourceEssayTypes: ['piq'],
  },

  // ARC ISSUES (5)
  {
    id: 'piq:arc-flat-no-conflict',
    dimension: 'narrative_arc_stakes',
    severity: 'critical',
    oneLineTrigger: 'Reads as summary of events with no clear problem, obstacle, or internal conflict driving the story.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:arc-unclear-stakes',
    dimension: 'narrative_arc_stakes',
    severity: 'critical',
    oneLineTrigger: 'Activity and events present but never clarifies what was at risk or why the outcome mattered.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:arc-no-turning-point',
    dimension: 'narrative_arc_stakes',
    severity: 'major',
    oneLineTrigger: 'Describes a journey but lacks a specific moment when something shifted.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:arc-too-neat-resolved',
    dimension: 'narrative_arc_stakes',
    severity: 'minor',
    oneLineTrigger: 'Arc wraps up too cleanly — suggests the challenge is fully resolved and all answers are known.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:arc-summary-not-scene',
    dimension: 'narrative_arc_stakes',
    severity: 'major',
    oneLineTrigger: 'Heavy summary ("I did X, then Y, then Z") rather than specific scenes with dialogue, action, sensory detail.',
    sourceEssayTypes: ['piq'],
  },

  // SPECIFICITY ISSUES (4)
  {
    id: 'piq:spec-no-numbers',
    dimension: 'specificity_evidence',
    severity: 'critical',
    oneLineTrigger: 'Lacks concrete numbers — uses "many", "often", "significant", "a lot" instead of quantified evidence.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:spec-vague-descriptions',
    dimension: 'specificity_evidence',
    severity: 'major',
    oneLineTrigger: 'Relies on vague qualifiers ("many", "various", "significant") instead of concrete specifics.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:spec-missing-sensory',
    dimension: 'specificity_evidence',
    severity: 'major',
    oneLineTrigger: 'Missing sensory details — no sight, sound, smell, touch, taste grounding moments in lived experience.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:spec-no-time-specificity',
    dimension: 'specificity_evidence',
    severity: 'minor',
    oneLineTrigger: 'Events unanchored in time — no dates, durations, or sequences to ground the journey.',
    sourceEssayTypes: ['piq'],
  },

  // VOICE ISSUES (5)
  {
    id: 'piq:voice-essay-speak',
    dimension: 'voice_integrity',
    severity: 'critical',
    oneLineTrigger: 'Manufactured essay-speak ("this taught me that", "through this experience") instead of authentic voice.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:voice-passive',
    dimension: 'voice_integrity',
    severity: 'major',
    oneLineTrigger: 'Overuse of passive voice ("was organized by", "were chosen") obscures agency.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:voice-vocabulary-showing-off',
    dimension: 'voice_integrity',
    severity: 'minor',
    oneLineTrigger: 'Unnecessarily complex vocabulary ("plethora", "multifaceted", "paradigm") — trying to impress over communicate.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:voice-sounds-like-ai',
    dimension: 'voice_integrity',
    severity: 'critical',
    oneLineTrigger: 'AI-typical phrasing ("delve into", "it is important to note", "furthermore") damages authenticity.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:voice-monotone-rhythm',
    dimension: 'voice_integrity',
    severity: 'minor',
    oneLineTrigger: 'Sentences follow repetitive length/structure pattern — monotone, robotic rhythm.',
    sourceEssayTypes: ['piq'],
  },

  // REFLECTION ISSUES (5)
  {
    id: 'piq:reflect-generic-lessons',
    dimension: 'reflection_insight',
    severity: 'critical',
    oneLineTrigger: 'Generic lessons ("I learned teamwork", "discovered leadership") that could apply to anyone.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:reflect-no-belief-shift',
    dimension: 'reflection_insight',
    severity: 'major',
    oneLineTrigger: 'Describes what was learned but does not show how thinking/beliefs/worldview shifted.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:reflect-surface-observations',
    dimension: 'reflection_insight',
    severity: 'major',
    oneLineTrigger: 'Surface-level reflection — describes what happened or felt without digging into WHY or meaning.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:reflect-prescriptive-takeaway',
    dimension: 'reflection_insight',
    severity: 'major',
    oneLineTrigger: 'Closes with prescriptive advice ("everyone should", "we must") instead of personal earned insight.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:reflect-missing-self-realization',
    dimension: 'reflection_insight',
    severity: 'major',
    oneLineTrigger: 'Focuses on external events or lessons without revealing what was learned about SELF.',
    sourceEssayTypes: ['piq'],
  },

  // IDENTITY ISSUES (5)
  {
    id: 'piq:identity-missing-thread',
    dimension: 'identity_self_discovery',
    severity: 'major',
    oneLineTrigger: 'Describes activities and events without revealing who the writer IS — values, drivers, identity.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:identity-told-not-shown',
    dimension: 'identity_self_discovery',
    severity: 'major',
    oneLineTrigger: 'Identity stated ("I am curious", "I am passionate") rather than demonstrated through actions/choices.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:identity-inconsistent',
    dimension: 'identity_self_discovery',
    severity: 'minor',
    oneLineTrigger: 'Conflicting aspects of identity present without acknowledging the complexity — creates confusion.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:identity-no-values-visible',
    dimension: 'identity_self_discovery',
    severity: 'major',
    oneLineTrigger: 'Values not visible — readers cannot see what matters to the writer or drives their decisions.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:identity-superficial-discovery',
    dimension: 'identity_self_discovery',
    severity: 'major',
    oneLineTrigger: 'Self-discovery stays surface ("I found my passion") without exploring WHY or what specifically drew them.',
    sourceEssayTypes: ['piq'],
  },

  // CRAFT ISSUES (4)
  {
    id: 'piq:craft-no-dialogue',
    dimension: 'craft_language_quality',
    severity: 'minor',
    oneLineTrigger: 'No dialogue — no quoted speech from anyone in the narrative.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:craft-weak-verbs',
    dimension: 'craft_language_quality',
    severity: 'minor',
    oneLineTrigger: 'Generic verbs dominate ("was", "did", "had", "went", "got") — missing vivid action verbs.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:craft-no-imagery',
    dimension: 'craft_language_quality',
    severity: 'minor',
    oneLineTrigger: 'Purely literal prose with no metaphor, simile, or vivid imagery — reads dry.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:craft-cliched-language',
    dimension: 'craft_language_quality',
    severity: 'minor',
    oneLineTrigger: 'Clichéd phrases ("step outside my comfort zone", "think outside the box") add no original thinking.',
    sourceEssayTypes: ['piq'],
  },

  // COHERENCE / ARC OVERFLOW (3)
  {
    id: 'piq:coherence-scattered-themes',
    dimension: 'narrative_arc_stakes',
    severity: 'major',
    oneLineTrigger: 'Multiple themes present without a clear central throughline — essay feels unfocused.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:coherence-disconnected-paragraphs',
    dimension: 'narrative_arc_stakes',
    severity: 'minor',
    oneLineTrigger: 'Paragraphs feel like separate blocks — transitions missing or mechanical.',
    sourceEssayTypes: ['piq'],
  },
  {
    id: 'piq:coherence-theme-drift',
    dimension: 'narrative_arc_stakes',
    severity: 'minor',
    oneLineTrigger: 'Starts with one theme but drifts to different ideas without intentional evolution.',
    sourceEssayTypes: ['piq'],
  },
];

// ---------------------------------------------------------------------------
// Common App 35 patterns — ported from
// src/services/commonAppWorkshop/rubrics/issueDetectionPatterns.ts
// ---------------------------------------------------------------------------
// `affected_dimensions[]` is multi-valued in the source — we collapse to a
// single primary dimension string (first entry) for the catalog. Full dim
// array stays retrievable via the source library at L5.

const COMMON_APP_PATTERNS: readonly PatternSummary[] = [
  // CRITICAL (7)
  {
    id: 'common_app:swap-test-fail',
    dimension: 'fit_demonstration',
    severity: 'critical',
    oneLineTrigger: 'Why-us content has no college-specific details — passes the "swap another college name in" test unchanged.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:generic-origin-story',
    dimension: 'authenticity_voice',
    severity: 'critical',
    oneLineTrigger: 'Generic origin story ("I have always been interested in X") with no specific spark moment.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:essay-speak-heavy',
    dimension: 'authenticity_voice',
    severity: 'critical',
    oneLineTrigger: 'Multiple essay-speak phrases ("through this experience", "this taught me") — templated feel.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:vulnerability-dump',
    dimension: 'impact_growth',
    severity: 'critical',
    oneLineTrigger: 'Extensive problem description without proportional response/growth — trauma dumping.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:no-numbers',
    dimension: 'specificity_evidence',
    severity: 'critical',
    oneLineTrigger: 'No numbers, metrics, or specific quantities anywhere — impact feels unverifiable.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:ai-patterns',
    dimension: 'authenticity_voice',
    severity: 'critical',
    oneLineTrigger: 'Telltale AI-generated phrasing ("delve into", "tapestry", "multifaceted") — authenticity compromised.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:stated-not-shown',
    dimension: 'authenticity_voice',
    severity: 'critical',
    oneLineTrigger: 'Qualities/values claimed without narrative demonstration — "I am resilient" without proof.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },

  // MAJOR (21)
  {
    id: 'common_app:one-sided-fit',
    dimension: 'fit_demonstration',
    severity: 'major',
    oneLineTrigger: 'Discusses only what college offers OR what student brings — not both sides of fit.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:vague-diversity',
    dimension: 'authenticity_voice',
    severity: 'major',
    oneLineTrigger: 'Generic diversity claims without specific experiences or concrete examples.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:career-only',
    dimension: 'intellectual_engagement',
    severity: 'major',
    oneLineTrigger: 'Discusses career outcomes only — no genuine intellectual curiosity or love of the subject.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:vague-community',
    dimension: 'community_contribution',
    severity: 'major',
    oneLineTrigger: 'Vague future-involvement promises without past evidence of the pattern.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:trauma-without-agency',
    dimension: 'impact_growth',
    severity: 'major',
    oneLineTrigger: 'Victim narrative — describes challenge without showing personal agency or action.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:generic-lessons',
    dimension: 'impact_growth',
    severity: 'major',
    oneLineTrigger: 'Closes with clichéd takeaways ("value of teamwork", "never give up") — interchangeable insights.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:repeated-themes',
    dimension: 'strategic_positioning',
    severity: 'major',
    oneLineTrigger: 'Repeats themes already covered elsewhere in the application — wastes the essay slot.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:defensive-or-apologetic',
    dimension: 'authenticity_voice',
    severity: 'major',
    oneLineTrigger: 'Defensive, apologetic, or self-deprecating tone undermines authority and ownership.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:bragging-without-vulnerability',
    dimension: 'authenticity_voice',
    severity: 'major',
    oneLineTrigger: 'Achievement-focused with zero vulnerability or struggle — reads as performance.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:unrealistic-goals',
    dimension: 'perspective_maturity',
    severity: 'major',
    oneLineTrigger: 'Grandiose claims about changing the world or solving major problems — lacks realism.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:just-describing',
    dimension: 'impact_growth',
    severity: 'major',
    oneLineTrigger: 'Chronological description of events without reflection or internal meaning-making.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:making-excuses',
    dimension: 'perspective_maturity',
    severity: 'major',
    oneLineTrigger: 'Frames weaknesses as excuses rather than areas for growth or learning.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:passive-participation',
    dimension: 'impact_growth',
    severity: 'major',
    oneLineTrigger: 'Describes being part of something without showing individual contribution or initiative.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:resume-listing',
    dimension: 'narrative_coherence',
    severity: 'major',
    oneLineTrigger: 'Lists achievements without narrative connection or personal meaning.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:over-narrated',
    dimension: 'specificity_evidence',
    severity: 'major',
    oneLineTrigger: 'Heavy storytelling without evidence, metrics, or substance — style outpaces substance.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:shallow-reflection',
    dimension: 'impact_growth',
    severity: 'major',
    oneLineTrigger: 'Reflection stays at surface level with generic lessons — no earned insight.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:missing-intellectual-engagement',
    dimension: 'intellectual_engagement',
    severity: 'major',
    oneLineTrigger: 'Describes activities without intellectual depth, curiosity, or domain-specific thinking.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:missing-evidence-of-impact',
    dimension: 'impact_growth',
    severity: 'major',
    oneLineTrigger: 'Claims impact without quantifiable evidence or specific outcomes.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:missing-technical-depth',
    dimension: 'intellectual_engagement',
    severity: 'major',
    oneLineTrigger: 'Essay about intellectual pursuit lacks domain knowledge, methodology, or technical specifics.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:missing-character-through-thought',
    dimension: 'authenticity_voice',
    severity: 'major',
    oneLineTrigger: 'Describes actions without revealing internal thought process or character.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:missing-unique-insight',
    dimension: 'authenticity_voice',
    severity: 'major',
    oneLineTrigger: 'Insights could have been written by anyone with similar experience — no unique angle.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },

  // MINOR (7)
  {
    id: 'common_app:weak-opening',
    dimension: 'narrative_coherence',
    severity: 'minor',
    oneLineTrigger: 'Opens with generic, low-stakes language that fails to create immediate interest.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:no-dialogue',
    dimension: 'narrative_coherence',
    severity: 'minor',
    oneLineTrigger: 'Narrative essay with no quoted speech — scenes feel reported rather than lived.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:weak-verbs',
    dimension: 'authenticity_voice',
    severity: 'minor',
    oneLineTrigger: 'Overuse of generic verbs ("was", "did", "got") where specific verbs would carry more.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:adjective-stacking',
    dimension: 'authenticity_voice',
    severity: 'minor',
    oneLineTrigger: 'Multiple adjectives stacked where one precise one would do.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:throat-clearing',
    dimension: 'narrative_coherence',
    severity: 'minor',
    oneLineTrigger: 'Unnecessary setup phrases ("As I sit here", "I remember when") before the real content.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:word-count-padding',
    dimension: 'narrative_coherence',
    severity: 'minor',
    oneLineTrigger: 'Filler phrases that add length without adding content — pads to hit limit.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
  {
    id: 'common_app:missing-complexity',
    dimension: 'perspective_maturity',
    severity: 'minor',
    oneLineTrigger: 'Oversimplified narrative — no tensions, trade-offs, or acknowledgment of complexity.',
    sourceEssayTypes: ['common_app', 'supplement'],
  },
];

// ---------------------------------------------------------------------------
// Combined index
// ---------------------------------------------------------------------------

const ALL_PATTERNS: readonly PatternSummary[] = [
  ...PIQ_PATTERNS,
  ...COMMON_APP_PATTERNS,
];

/**
 * O(1) lookup from namespaced pattern ID → PatternSummary. Frozen at
 * module-load so consumers can rely on stable identity.
 */
export const PATTERN_INDEX: ReadonlyMap<string, PatternSummary> = new Map(
  ALL_PATTERNS.map((p) => [p.id, p] as const),
);

/**
 * Defensive known-id guard for `validateAndTransform` in analysisPass.ts.
 */
export function isKnownPatternId(id: string): boolean {
  return PATTERN_INDEX.has(id);
}

// ---------------------------------------------------------------------------
// Filter / ordering
// ---------------------------------------------------------------------------

const SEVERITY_RANK: Record<PatternSeverity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
};

/** Which pattern-essayType pool applies to a given EssayProfile.essayType. */
function poolFor(essayType: EssayType): PatternEssayType {
  // 'supplement' re-uses the 'common_app' catalog today (common_app patterns
  // declare both 'common_app' and 'supplement' in sourceEssayTypes).
  return essayType === 'piq' ? 'piq' : essayType === 'supplement' ? 'supplement' : 'common_app';
}

/**
 * Return the top-N catalog entries for an essayType, ordered by severity
 * (critical → major → minor) with a secondary dimension-round-robin
 * tiebreaker so the 15-entry slice does not concentrate in one rubric
 * dimension. De-duped on patternId.
 *
 * @param essayType  EssayProfile.index.essayType discriminator.
 * @param topN       Max catalog entries to surface (default 15 per verdict).
 */
export function getFilteredCatalog(
  essayType: EssayType,
  topN = 15,
): PatternSummary[] {
  const pool = poolFor(essayType);
  const matching = ALL_PATTERNS.filter((p) => p.sourceEssayTypes.includes(pool));

  // De-dupe by id (defensive — pools shouldn't overlap within a single call).
  const seen = new Set<string>();
  const deduped: PatternSummary[] = [];
  for (const p of matching) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    deduped.push(p);
  }

  // Partition by severity, then round-robin across dimensions within each band
  // so a 15-entry slice doesn't cluster in one dimension (e.g., all voice).
  const byBand: Record<PatternSeverity, PatternSummary[]> = {
    critical: [],
    major: [],
    minor: [],
  };
  for (const p of deduped) byBand[p.severity].push(p);

  const spread = (list: PatternSummary[]): PatternSummary[] => {
    const buckets = new Map<string, PatternSummary[]>();
    for (const p of list) {
      const arr = buckets.get(p.dimension) ?? [];
      arr.push(p);
      buckets.set(p.dimension, arr);
    }
    const dims = Array.from(buckets.keys()).sort();
    const out: PatternSummary[] = [];
    let hadAny = true;
    while (hadAny) {
      hadAny = false;
      for (const d of dims) {
        const arr = buckets.get(d);
        if (arr && arr.length > 0) {
          out.push(arr.shift()!);
          hadAny = true;
        }
      }
    }
    return out;
  };

  const ordered = [
    ...spread(byBand.critical),
    ...spread(byBand.major),
    ...spread(byBand.minor),
  ];

  return ordered.slice(0, Math.max(0, topN));
}

/**
 * Render the filtered catalog as a prompt-ready block body (lines only).
 * The `@prompt-block B1_PATTERN_LIBRARY` wrapper is applied by the caller
 * in analysisPass.ts — the block tag must live next to the template literal
 * authored in the prompt file, per lint convention.
 */
export function renderCatalogLines(summaries: readonly PatternSummary[]): string {
  return summaries
    .map((p) => `- ${p.id} [${p.severity} · ${p.dimension}] — ${p.oneLineTrigger}`)
    .join('\n');
}

/**
 * Stats for tests and telemetry — exposed so the Port B1 test can assert
 * non-empty pools without importing the raw arrays.
 */
export const PATTERN_STATS = {
  piqCount: PIQ_PATTERNS.length,
  commonAppCount: COMMON_APP_PATTERNS.length,
  totalCount: ALL_PATTERNS.length,
} as const;
