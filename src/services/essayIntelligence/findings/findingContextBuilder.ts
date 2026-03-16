/**
 * FindingContextBuilder — Builds finding context for LLM prompts.
 *
 * Serializes the FindingStore into prompt-ready text that the LLM can consume.
 * Two sections:
 * 1. ACTIVE FINDINGS — all non-superseded findings with full detail
 * 2. SUPERSEDED — brief summary of superseded findings (so the LLM
 *    doesn't re-derive the same wrong readings)
 *
 * Token-aware: can produce compact or detailed representations
 * depending on the token budget.
 */

import type {
  Finding,
  FindingCoachingValue,
} from '../profileTypes';
import { FindingStore, COACHING_VALUE_ORDER } from './findingStore';

/** Options for controlling context output detail level */
export interface FindingContextOptions {
  /** Maximum number of active findings to include (0 = all) */
  maxActiveFindings?: number;
  /** Whether to include superseded findings summary */
  includeSuperseded?: boolean;
  /** Whether to include full evidence in each finding */
  includeEvidence?: boolean;
  /** Whether to include lineage history */
  includeLineage?: boolean;
  /** Whether to include deepening potential */
  includeDeepeningPotential?: boolean;
  /** Filter to specific paragraph scope */
  scopeFilter?: number;
  /** Filter to minimum coaching value */
  minCoachingValue?: FindingCoachingValue;
}

const DEFAULT_OPTIONS: Required<FindingContextOptions> = {
  maxActiveFindings: 0,
  includeSuperseded: true,
  includeEvidence: true,
  includeLineage: false,
  includeDeepeningPotential: true,
  scopeFilter: -1,
  minCoachingValue: 'diagnostic',
};

/**
 * Build the full finding context for injection into an LLM prompt.
 * Returns a formatted string with active findings and superseded summary.
 */
export function buildFindingContext(
  store: FindingStore,
  options: FindingContextOptions = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const sections: string[] = [];

  // Active findings section
  const activeSection = buildActiveSection(store, opts);
  if (activeSection) {
    sections.push(activeSection);
  }

  // Superseded findings section
  if (opts.includeSuperseded) {
    const supersededSection = buildSupersededSection(store);
    if (supersededSection) {
      sections.push(supersededSection);
    }
  }

  if (sections.length === 0) {
    return '=== FINDINGS ===\nNo findings yet.';
  }

  return sections.join('\n\n');
}

/**
 * Build a compact finding context for token-constrained prompts.
 * Only includes finding IDs, claims, maturity, and coaching value.
 */
export function buildCompactFindingContext(store: FindingStore): string {
  const active = store.getActiveSortedByCoachingValue();
  if (active.length === 0) {
    return '=== FINDINGS ===\nNo findings yet.';
  }

  const lines = active.map(f =>
    `${f.id} [${f.maturity}/${f.coachingValue}] ${f.claim.slice(0, 150)}${f.claim.length > 150 ? '...' : ''}`
  );

  return `=== FINDINGS (${active.length} active) ===\n${lines.join('\n')}`;
}

/**
 * Build context for a specific paragraph's findings.
 * Used by the walk when reading a paragraph.
 */
export function buildParagraphFindingContext(
  store: FindingStore,
  paragraphIndex: number,
): string {
  const findings = store.getByScope(paragraphIndex);
  if (findings.length === 0) {
    return '';
  }

  const lines = findings.map(f => formatFinding(f, {
    ...DEFAULT_OPTIONS,
    includeLineage: false,
    includeEvidence: true,
    includeDeepeningPotential: true,
  }));

  return `=== EXISTING FINDINGS FOR P${paragraphIndex} ===\n${lines.join('\n\n')}`;
}

/**
 * Build context showing findings available for relationship references.
 * Used when the walk is producing new findings that might buildsOn or relatedTo existing ones.
 */
export function buildFindingReferenceContext(store: FindingStore): string {
  const active = store.getActiveSortedByCoachingValue();
  if (active.length === 0) {
    return '';
  }

  const lines = active.map(f => {
    const scopeStr = formatScopeCompact(f);
    const dims = f.dimensions.join(', ');
    const buildChain = f.buildsOn.length > 0 ? ` (builds on: ${f.buildsOn.join(', ')})` : '';
    return `${f.id} [${f.maturity}] ${scopeStr} [${dims}]${buildChain}: ${f.claim.slice(0, 120)}${f.claim.length > 120 ? '...' : ''}`;
  });

  return `=== EXISTING FINDINGS (for relationship references) ===\n${lines.join('\n')}`;
}

// ── Internal helpers ─────────────────────────────────────────────

function buildActiveSection(
  store: FindingStore,
  opts: Required<FindingContextOptions>,
): string | null {
  let active = store.getActiveSortedByCoachingValue();

  // Apply scope filter
  if (opts.scopeFilter >= 0) {
    active = active.filter(f =>
      f.scope.paragraph === opts.scopeFilter ||
      (f.scope.paragraphs && f.scope.paragraphs.includes(opts.scopeFilter))
    );
  }

  // Apply coaching value filter
  if (opts.minCoachingValue !== 'diagnostic') {
    const threshold = COACHING_VALUE_ORDER[opts.minCoachingValue];
    active = active.filter(f =>
      COACHING_VALUE_ORDER[f.coachingValue] <= threshold
    );
  }

  // Apply limit
  if (opts.maxActiveFindings > 0 && active.length > opts.maxActiveFindings) {
    active = active.slice(0, opts.maxActiveFindings);
  }

  if (active.length === 0) {
    return null;
  }

  const formatted = active.map(f => formatFinding(f, opts));
  return `=== ACTIVE FINDINGS (${active.length}) ===\n${formatted.join('\n\n')}`;
}

function buildSupersededSection(store: FindingStore): string | null {
  const superseded = store.getSuperseded();
  if (superseded.length === 0) {
    return null;
  }

  const lines = superseded.map(f => {
    const replacedBy = f.supersededBy ? ` (superseded by ${f.supersededBy})` : '';
    const reason = f.supersessionReason
      ? `: ${f.supersessionReason.slice(0, 150)}${f.supersessionReason.length > 150 ? '...' : ''}`
      : '';
    return `${f.id}${replacedBy}${reason}`;
  });

  return `=== SUPERSEDED (do not re-derive these readings) ===\n${lines.join('\n')}`;
}

function formatFinding(
  f: Finding,
  opts: Required<FindingContextOptions>,
): string {
  const parts: string[] = [];

  // Header line
  const scopeStr = formatScopeCompact(f);
  const dims = f.dimensions.join(', ');
  const relations: string[] = [];
  if (f.buildsOn.length > 0) relations.push(`builds on: ${f.buildsOn.join(', ')}`);
  if (f.relatedTo.length > 0) relations.push(`related to: ${f.relatedTo.join(', ')}`);
  const relStr = relations.length > 0 ? ` | ${relations.join(' | ')}` : '';

  parts.push(
    `${f.id} [${f.maturity}/${f.coachingValue}] ${scopeStr} [${dims}]${relStr}`
  );

  // Claim
  parts.push(`  Claim: ${f.claim}`);

  // Evidence
  if (opts.includeEvidence && f.evidence.length > 0) {
    const evidenceLines = f.evidence.map(e => {
      const locStr = e.location
        ? ` (P${e.location.paragraph}${e.location.sentence !== undefined ? `S${e.location.sentence}` : ''})`
        : '';
      return `    [${e.type}]${locStr} ${e.text}`;
    });
    parts.push(`  Evidence:\n${evidenceLines.join('\n')}`);
  }

  // Deepening potential
  if (opts.includeDeepeningPotential && f.deepeningPotential !== null) {
    parts.push(`  Deepening potential: ${f.deepeningPotential}`);
  }

  // Questions
  if (f.raisesQuestions.length > 0) {
    parts.push(`  Questions: ${f.raisesQuestions.join('; ')}`);
  }

  // Lineage
  if (opts.includeLineage && f.lineage.length > 0) {
    const lineageLines = f.lineage.map(l =>
      `    ${l.previousMaturity} -> ${l.newMaturity} [${l.trigger}]: ${l.reasoning.slice(0, 100)}`
    );
    parts.push(`  Lineage:\n${lineageLines.join('\n')}`);
  }

  return parts.join('\n');
}

function formatScopeCompact(f: Finding): string {
  switch (f.scope.type) {
    case 'essay_level':
      return 'essay-level';
    case 'cross_paragraph':
      return `P${(f.scope.paragraphs ?? []).join('+P')}`;
    case 'paragraph':
      return `P${f.scope.paragraph ?? '?'}`;
    case 'sentence_group':
      return `P${f.scope.paragraph ?? '?'}S${(f.scope.sentences ?? []).join(',')}`;
    case 'sentence':
      return `P${f.scope.paragraph ?? '?'}S${(f.scope.sentences ?? [])[0] ?? '?'}`;
    case 'word':
      return `P${f.scope.paragraph ?? '?'}S${(f.scope.sentences ?? [])[0] ?? '?'} (word)`;
    default:
      return f.scope.type;
  }
}

/**
 * Build a compact finding context for a specific paragraph, formatted for
 * annotation prompts (L5). Includes finding ID ([F1], [F2]), claim, maturity,
 * and coaching value — enough for the annotation LLM to reference findings
 * without overwhelming the prompt with full evidence.
 *
 * W7.1: Used by deepAnnotationService to inject per-paragraph finding context
 * into Block 3 (paragraph-specific, not cached).
 */
export function buildAnnotationFindingContext(
  store: FindingStore,
  paragraphIndex: number,
): string {
  // Get findings scoped to this paragraph
  const scopedFindings = store.getByScope(paragraphIndex);
  // Also include essay-level findings that apply broadly
  const essayLevelFindings = store.getActive().filter(f =>
    f.scope.type === 'essay_level' ||
    (f.scope.type === 'cross_paragraph' && f.scope.paragraphs?.includes(paragraphIndex))
  );

  // Merge and deduplicate
  const seen = new Set<string>();
  const allRelevant: Finding[] = [];
  for (const f of [...scopedFindings, ...essayLevelFindings]) {
    if (!seen.has(f.id)) {
      seen.add(f.id);
      allRelevant.push(f);
    }
  }

  if (allRelevant.length === 0) {
    return '';
  }

  // Sort by coaching value (most important first)
  allRelevant.sort((a, b) =>
    COACHING_VALUE_ORDER[a.coachingValue] - COACHING_VALUE_ORDER[b.coachingValue]
  );

  const lines = allRelevant.map(f => {
    const claim = f.claim.length > 180
      ? `${f.claim.slice(0, 180)}...`
      : f.claim;
    return `  [${f.id}] [${f.maturity}/${f.coachingValue}] ${claim}`;
  });

  return `RELEVANT FINDINGS FOR P${paragraphIndex}:\n${lines.join('\n')}`;
}

/**
 * Derive SentenceParticipation-style data from findings.
 * Returns finding refs, significance, and tags for a specific sentence.
 *
 * Note: `significance` derivation here is a convenience for UI display,
 * not an analytical judgment (Rule 6). The actual significance is in
 * the findings themselves.
 */
export function deriveSentenceParticipation(
  paragraph: number,
  sentence: number,
  store: FindingStore,
): {
  findingRefs: string[];
  significance: 'pivotal' | 'contributing' | 'transitional' | 'unremarkable';
  tags: string[];
  primaryFunction: string;
} {
  const relevantFindings = store.getActive().filter(f =>
    (f.scope.paragraph === paragraph && f.scope.sentences?.includes(sentence)) ||
    (f.scope.paragraphs?.includes(paragraph))
  );

  const findingRefs = relevantFindings.map(f => f.id);
  const tags = [...new Set(relevantFindings.flatMap(f => f.dimensions))];

  let significance: 'pivotal' | 'contributing' | 'transitional' | 'unremarkable';
  if (relevantFindings.length === 0) {
    significance = 'unremarkable';
  } else if (relevantFindings.some(f => f.coachingValue === 'critical')) {
    significance = 'pivotal';
  } else if (relevantFindings.some(f => f.coachingValue === 'high')) {
    significance = 'contributing';
  } else {
    significance = 'transitional';
  }

  const primaryFunction = relevantFindings.length > 0
    ? relevantFindings.sort(
        (a, b) => COACHING_VALUE_ORDER[a.coachingValue] - COACHING_VALUE_ORDER[b.coachingValue]
      )[0].claim.slice(0, 200)
    : '';

  return { findingRefs, significance, tags, primaryFunction };
}
