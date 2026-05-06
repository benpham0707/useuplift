/**
 * Dump self-audit lint — mechanically detects the recurring problems
 * surfaced by every full-profile audit ("R1–R6" in
 * `tests/output/full-profile-14-harvard-2028-crochet-AUDIT.md`).
 *
 * Pure functions over a markdown dump string. No I/O, no LLM calls.
 *
 * Exists so we stop re-paying for API runs to confirm the same problems
 * we already know about. Run this against any dump artifact to get a
 * deterministic punch-list with line numbers.
 *
 * Usage:
 *   import { lintDump, summarizeLint } from '.../dumpLint';
 *   const findings = lintDump(markdownString);
 *   console.log(summarizeLint(findings));
 */

export type LintRuleId =
  | 'R1_zero_indexed_paragraph_in_user_facing_prose'
  | 'R2_tentative_connection_in_markdown'
  | 'R3_empty_schema_stub'
  | 'R4_repeated_verdict_prose';

export interface LintFinding {
  rule: LintRuleId;
  line: number; // 1-indexed
  excerpt: string; // up to 120 chars of the offending line
  severity: 'blocking' | 'warn' | 'info';
}

export interface LintResult {
  findings: LintFinding[];
  countsByRule: Record<LintRuleId, number>;
  totalLines: number;
}

// ─── R1: zero-indexed paragraph in user-facing prose ─────────────────
//
// User-facing prose should display paragraphs 1-indexed. The data layer
// remains 0-indexed (ParagraphLocation.paragraph: number, etc.) — the
// problem is only when the LLM emits "P0" or "P1S0" inside prose strings
// that get rendered into the dump.
//
// Heuristic: any "P0" reference in prose is a defect. References to
// "P1"–"P9" cannot be classified without per-section context (some are
// 1-indexed and correct; some are 0-indexed and off-by-one). So we only
// flag "P0" — if the prose said "P0" it's almost certainly 0-indexed.
const R1_ZERO_INDEXED_RE = /\bP0(?:S\d+)?\b/g;

// ─── R2: tentative connection rendered into the markdown ─────────────
//
// Scout-discovered connections at strength=tentative are working memory
// for the walker; they should not appear in any rendered profile output.
// Renderer should filter to strength ∈ {foundational, significant, supporting}.
const R2_TENTATIVE_STRENGTH_RE = /^- \*\*Strength\*\*:\s+tentative\s*$/;

// ─── R3: empty schema stub ───────────────────────────────────────────
//
// Lines like "  *Inferred Intents:* (none)" or "- Rhetorical functions: (none)"
// are schema fields that are never populated. Renderer should suppress them.
//
// We match labelled-field lines that end with "(none)" (or "(empty)" or
// "(not available)" variants), excluding section-level "no entries" markers
// (those are deliberate). Heuristic: bullet-style labelled fields under
// per-sentence/per-paragraph headings.
const R3_EMPTY_STUB_RE = /^\s*[-*]\s+\*?\*?[A-Z][^:]+\*?\*?:\s*\((?:none|empty|not available|null)\)\s*$/i;

// ─── R4: repeated verbatim verdict prose ─────────────────────────────
//
// We capture "long" prose lines (>180 chars) and flag any line that
// appears verbatim in 3+ places. This is best-effort: it catches the
// per-paragraph verdict duplication described in §3.4 of the audit.
function detectRepeatedLines(
  lines: string[],
  minLength: number,
  minOccurrences: number,
): Map<string, number[]> {
  const counts = new Map<string, number[]>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length < minLength) continue;
    // Skip JSON-ish / code-block lines
    if (line.startsWith('|') || line.startsWith('```') || line.startsWith('"')) continue;
    if (!counts.has(line)) counts.set(line, []);
    counts.get(line)!.push(i + 1);
  }
  // Filter to those with minOccurrences
  for (const [key, indices] of counts) {
    if (indices.length < minOccurrences) counts.delete(key);
  }
  return counts;
}

// Sections that are NOT user-facing — we don't lint R1 inside them.
// Heuristic: section headings that contain these tokens are system-internal
// and may legitimately reference 0-indexed ParagraphLocation fields by name.
const SYSTEM_INTERNAL_SECTION_PATTERNS: RegExp[] = [
  /^## 1\. Pipeline Overview/i,
  /^## 7\. Connections/i,
  /^### 7\.1 Connections/i,
  /^### 7\.2 Entanglements/i,
  /^## 13\. Profile Index/i,
  /^## 14\. Profile Metadata/i,
];

function isSystemInternalSection(currentHeading: string): boolean {
  return SYSTEM_INTERNAL_SECTION_PATTERNS.some((re) => re.test(currentHeading));
}

export function lintDump(markdown: string): LintResult {
  const lines = markdown.split('\n');
  const findings: LintFinding[] = [];

  let currentHeading = '';

  // ─── R1, R2, R3 (line-by-line) ───
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track most-recent ## or ### heading
    if (/^#{2,3}\s/.test(line)) {
      currentHeading = line.trim();
    }

    // R1: zero-indexed paragraph in user-facing prose
    if (!isSystemInternalSection(currentHeading)) {
      const matches = line.match(R1_ZERO_INDEXED_RE);
      if (matches) {
        for (const _m of matches) {
          findings.push({
            rule: 'R1_zero_indexed_paragraph_in_user_facing_prose',
            line: lineNum,
            excerpt: line.trim().slice(0, 120),
            severity: 'blocking',
          });
          break; // one finding per line is enough
        }
      }
    }

    // R2: tentative connection — counts in any section
    if (R2_TENTATIVE_STRENGTH_RE.test(line)) {
      findings.push({
        rule: 'R2_tentative_connection_in_markdown',
        line: lineNum,
        excerpt: line.trim().slice(0, 120),
        severity: 'warn',
      });
    }

    // R3: empty schema stub
    if (R3_EMPTY_STUB_RE.test(line)) {
      findings.push({
        rule: 'R3_empty_schema_stub',
        line: lineNum,
        excerpt: line.trim().slice(0, 120),
        severity: 'warn',
      });
    }
  }

  // ─── R4 (multi-line) ───
  const repeated = detectRepeatedLines(lines, 180, 3);
  for (const [text, occurrences] of repeated) {
    findings.push({
      rule: 'R4_repeated_verdict_prose',
      line: occurrences[0],
      excerpt: text.slice(0, 120),
      severity: 'warn',
    });
  }

  const countsByRule: Record<LintRuleId, number> = {
    R1_zero_indexed_paragraph_in_user_facing_prose: 0,
    R2_tentative_connection_in_markdown: 0,
    R3_empty_schema_stub: 0,
    R4_repeated_verdict_prose: 0,
  };
  for (const f of findings) {
    countsByRule[f.rule] += 1;
  }

  return {
    findings,
    countsByRule,
    totalLines: lines.length,
  };
}

export function summarizeLint(result: LintResult): string {
  const lines: string[] = [];
  lines.push(`Dump lint summary — ${result.totalLines} lines scanned`);
  lines.push('');
  lines.push(`R1 (zero-indexed paragraph in user-facing prose):  ${result.countsByRule.R1_zero_indexed_paragraph_in_user_facing_prose}`);
  lines.push(`R2 (tentative connections rendered):                ${result.countsByRule.R2_tentative_connection_in_markdown}`);
  lines.push(`R3 (empty schema stubs):                            ${result.countsByRule.R3_empty_schema_stub}`);
  lines.push(`R4 (verbatim verdict repeated 3+ times):            ${result.countsByRule.R4_repeated_verdict_prose}`);
  lines.push('');
  lines.push(`Total findings: ${result.findings.length}`);
  return lines.join('\n');
}
