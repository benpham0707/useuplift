#!/usr/bin/env tsx
/**
 * Descriptive-Contract Lint for L1 / L3 / L3.75 Prompt Purity
 *
 * Wave-1b Pre-req 4 (see docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md Section 4).
 *
 * CONTRACT: The first-impressions (L1), sequential-deep-walk (L3), and
 * holistic-synthesis (L3.75) layers are PURELY DESCRIPTIVE. Their prompts
 * describe WHAT IS, never HOW WELL. Any evaluative or prescriptive vocabulary
 * leaking into those prompt strings risks contaminating the
 * understanding → analysis → feedback separation.
 *
 * Multiple P0 ports as originally drafted would have injected such vocabulary
 * into these prompts. This lint mechanically catches any regression at PR time.
 *
 * WHAT IT DOES
 *   1. Reads the three target files.
 *   2. Extracts every PROMPT CONSTANT (template literals assigned to an
 *      identifier matching /PROMPT|PREAMBLE|TEMPLATE/).
 *   3. Scans each line of each prompt block for unambiguously-evaluative
 *      vocabulary (word-boundary, case-insensitive).
 *   4. Excludes legitimate references:
 *        • Lines inside a FORBIDDEN / BANNED / CARVE-OUT declaration region
 *          (from a header containing those words until the next section
 *          heading delimited by "===" or "---").
 *        • Lines inside a CONTAMINATION-EXAMPLES / WRONG / CONTAMINATED
 *          demonstration region (the prompt deliberately shows bad output so
 *          the model can recognize it).
 *        • Lines whose only occurrence of a forbidden word is INSIDE a
 *          quoted demonstration string AND the line also contains a negative
 *          marker (WRONG, CONTAMINATED, INCORRECT, NOT, NEVER, DO NOT,
 *          avoid, don't).
 *        • Lines that carry the inline escape marker
 *            // @descriptive-contract-ok: <reason>
 *        • Bare dictionary lines: comma-separated lists of quoted banned
 *          tokens (the list enumeration itself).
 *
 * WHAT THE VOCABULARY DELIBERATELY EXCLUDES
 *   The starter vocabulary in the spec includes words like "should", "good",
 *   "bad", "better", "worse", "improve", "fix", "strength", "weaker", etc.
 *   These are ubiquitous in the existing prompts as META-INSTRUCTIONS to the
 *   LLM ("field X should follow from Y") and as CATEGORY LABELS
 *   ("strong-essay category", JSON field "strength": ...), NOT as
 *   evaluations of the essay under review. Including them produces >60
 *   false positives on baseline. The lint therefore restricts itself to
 *   tokens that are essentially ALWAYS evaluative of a subject
 *   ("effective", "compelling", "masterful", "mediocre", "brilliant",
 *   "heartfelt", etc.) — the exact surface P0 ports 3/5/6/8 would have
 *   regressed on.
 *
 * Run:   npx tsx tests/test-descriptive-contract-lint.ts
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname, relative, sep } from 'path';
import { fileURLToPath } from 'url';

import {
  PROMPT_BLOCK_DECLARATIONS,
  isKnownBlockId,
  type PromptBlockId,
} from '../../src/lib/llm/promptBlockVersions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Forbidden vocabulary — narrow, high-signal subset
// ---------------------------------------------------------------------------
// Source of truth for THIS lint. The in-code BANNED/FORBIDDEN lists live in:
//   - src/services/essayIntelligence/analysis/firstImpressions.ts (~L74)
//   - src/services/essayIntelligence/analysis/sequentialDeepWalk.ts (~L183)
//   - src/services/essayIntelligence/analysis/holisticSynthesis.ts (~L254)
// We duplicate the vocabulary here deliberately so this lint's contract is
// explicit and independent of any one file drifting. If you expand the
// in-code lists, mirror the additions here.
//
// NOTE: We intentionally restrict to tokens that are almost never used in
// meta-instructions or technical labels — only as evaluations of the
// essay's quality. Broader tokens ("should", "better", "strong") appear
// legitimately throughout baseline prompts as instructions/labels and are
// NOT included. If a future regression introduces one of those tokens in
// an evaluative context, prefer a targeted addition here plus a matching
// exclusion pattern rather than a blanket ban.
const FORBIDDEN_WORDS: readonly string[] = [
  // effectiveness axis
  'effective', 'effectively', 'ineffective',
  // compelling / lackluster
  'compelling', 'uncompelling', 'lackluster',
  // quality adjectives (subject-descriptive only)
  'excellent', 'poor', 'terrible', 'brilliant', 'mediocre',
  'impressive', 'disappointing',
  // craft-quality adjectives
  'masterful', 'amateurish', 'clumsy', 'awkward',
  'well-crafted', 'poorly-crafted', 'poorly executed',
  // aesthetic adjectives
  'beautiful', 'ugly', 'heartfelt',
  // success axis (prescriptive)
  'succeeds in', 'fails to',
  // prescription (strictly student-directed)
  'must improve', 'would benefit from',
];

// ---------------------------------------------------------------------------
// Target files
// ---------------------------------------------------------------------------

const TARGET_FILES = [
  'src/services/essayIntelligence/analysis/firstImpressions.ts',
  'src/services/essayIntelligence/analysis/sequentialDeepWalk.ts',
  'src/services/essayIntelligence/analysis/holisticSynthesis.ts',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Violation {
  file: string;
  line: number;
  word: string;
  snippet: string;
}

interface PromptBlock {
  /** 1-based line where the template literal opens */
  startLine: number;
  /** 1-based line where the template literal closes */
  endLine: number;
  /** Identifier the template literal was assigned to (for diagnostics) */
  identifier: string;
}

// ---------------------------------------------------------------------------
// Extract template-literal prompt blocks
// ---------------------------------------------------------------------------
// We match identifiers whose name contains PROMPT, PREAMBLE, or TEMPLATE
// being assigned a backtick template literal, and walk forward until the
// closing unescaped top-level backtick.

function extractPromptBlocks(source: string): PromptBlock[] {
  const lines = source.split('\n');
  const blocks: PromptBlock[] = [];

  const OPEN_RE =
    /^\s*(?:export\s+)?const\s+([A-Za-z_][A-Za-z0-9_]*(?:PROMPT|PREAMBLE|TEMPLATE)[A-Za-z0-9_]*)\s*(?::[^=]+)?=\s*(?:`|\$\{[^}]*\}\s*`|[A-Z_]+\s*\+\s*`)/;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(OPEN_RE);
    if (!match) {
      i++;
      continue;
    }

    const identifier = match[1];
    const startLine = i + 1;
    const openIdx = line.indexOf('`');
    if (openIdx === -1) {
      i++;
      continue;
    }

    let endLine = -1;
    let j = i;
    let col = openIdx + 1;
    let depth = 0; // ${...} nesting
    outer: while (j < lines.length) {
      const ln = lines[j];
      while (col < ln.length) {
        const ch = ln[col];
        const prev = col > 0 ? ln[col - 1] : '';
        if (ch === '{' && prev === '$') {
          depth++;
          col++;
          continue;
        }
        if (ch === '}' && depth > 0) {
          depth--;
          col++;
          continue;
        }
        if (ch === '`' && depth === 0 && prev !== '\\') {
          endLine = j + 1;
          break outer;
        }
        col++;
      }
      j++;
      col = 0;
    }

    if (endLine === -1) {
      i++;
      continue;
    }

    blocks.push({ startLine, endLine, identifier });
    i = endLine;
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Exclusion: FORBIDDEN / BANNED / CARVE-OUT / CONTAMINATION-EXAMPLES regions
// ---------------------------------------------------------------------------

const REGION_OPEN_RE =
  /\b(FORBIDDEN\s+VOCABULARY|FORBIDDEN\s+VOCAB|BANNED\s+(?:WORDS|VOCABULARY|ROLE\s+LABELS)|CARVE[- ]?OUT|CONTAMINATION\s+EXAMPLES?|CONTAMINATED\s*\(|CONTAMINATED:)\b/i;

const SECTION_CLOSE_RE =
  /^(?:\s*===\s*[A-Z].*===\s*$|\s*---\s*[A-Z].*---\s*$|\s*===\s*$|\s*---\s*$)/;

function computeRegionExclusions(
  lines: string[],
  block: PromptBlock,
): Set<number> {
  const excluded = new Set<number>();
  let inRegion = false;
  // Cover the line immediately after a header even without a terminator.
  let enumerationRunway = 0;

  for (let n = block.startLine; n <= block.endLine; n++) {
    const line = lines[n - 1];

    if (REGION_OPEN_RE.test(line)) {
      inRegion = true;
      enumerationRunway = 3;
      excluded.add(n);
      continue;
    }

    if (inRegion) {
      if (n !== block.startLine && SECTION_CLOSE_RE.test(line) && !REGION_OPEN_RE.test(line)) {
        inRegion = false;
      } else {
        excluded.add(n);
        continue;
      }
    }

    if (enumerationRunway > 0) {
      excluded.add(n);
      enumerationRunway--;
    }
  }

  return excluded;
}

// ---------------------------------------------------------------------------
// Exclusion: lines that are clearly META (negative examples, taxonomy labels)
// ---------------------------------------------------------------------------
// Prompts legitimately contain:
//   (a) Negative examples / instructions — WRONG / INCORRECT / CONTAMINATED
//       demonstrations, "DO NOT evaluate whether it is effective", "never use
//       'compelling'", etc. Detect by presence of a negation marker on the
//       same line.
//   (b) Taxonomy/curriculum labels — "LEVEL 4 — Epistemological (EXCELLENT —
//       unlock deepest depth)". These label categories of understanding, not
//       the essay. Detect by the "LEVEL N —" prefix pattern.
//   (c) "WHY <word>:" gloss lines that explain the preceding taxonomy entry.

// Match whole-line triggers, not just word presence, to avoid swallowing
// lines that merely mention "not" in an unrelated context.
const NEGATIVE_MARKER_RE =
  /(^|[^A-Za-z])(WRONG|CONTAMINATED|INCORRECT|AVOID|NEVER(?!-)|DO\s+NOT|DON'?T|NOT\b\s+(?:to|say|evaluate|describe|use|prescribe|judge)|never\s+use)(?=[^A-Za-z]|$)/;

const TAXONOMY_LABEL_RE =
  /^\s*LEVEL\s+\d+\s*[—\-]/;

function isMetaLine(line: string): boolean {
  if (NEGATIVE_MARKER_RE.test(line)) return true;
  if (TAXONOMY_LABEL_RE.test(line)) return true;
  return false;
}

/**
 * "Why X:" gloss lines immediately follow a taxonomy-label line and explain
 * it. Track the previous line when deciding exclusions so that these glosses
 * inherit the meta-status of their parent label.
 */
const GLOSS_RE = /^\s*Why\s+[a-z]+:/i;

// ---------------------------------------------------------------------------
// Exclusion: quoted banned-list enumeration (anywhere in block)
// ---------------------------------------------------------------------------

function isQuotedEnumerationLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  const quotedCount = (trimmed.match(/"[^"]+"/g) ?? []).length;
  if (quotedCount < 3) return false;
  const residue = trimmed
    .replace(/"[^"]+"/g, '')
    .replace(/[,\s\-:—()]/g, '');
  return residue.length === 0;
}

// ---------------------------------------------------------------------------
// Inline escape marker
// ---------------------------------------------------------------------------

const ESCAPE_MARKER_RE = /\/\/\s*@descriptive-contract-ok\b/;

// ---------------------------------------------------------------------------
// Scan
// ---------------------------------------------------------------------------

function buildWordPattern(word: string): RegExp {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'i');
}

function scanFile(absPath: string, relPath: string): Violation[] {
  const source = readFileSync(absPath, 'utf8');
  const lines = source.split('\n');
  const blocks = extractPromptBlocks(source);
  const violations: Violation[] = [];
  const patterns = FORBIDDEN_WORDS.map(w => ({ word: w, re: buildWordPattern(w) }));

  for (const block of blocks) {
    const regionExcluded = computeRegionExclusions(lines, block);

    // Pre-compute per-line meta flag so gloss lines can inherit from parent.
    const metaFlags: boolean[] = new Array(lines.length).fill(false);
    for (let n = block.startLine; n <= block.endLine; n++) {
      metaFlags[n - 1] = isMetaLine(lines[n - 1]);
    }
    // Gloss line ("Why X:") inherits meta status from the nearest prior
    // taxonomy-label line within a small look-back window.
    const GLOSS_LOOKBACK = 6;
    for (let n = block.startLine; n <= block.endLine; n++) {
      if (!GLOSS_RE.test(lines[n - 1])) continue;
      for (let p = n - 2; p >= Math.max(block.startLine - 1, n - 2 - GLOSS_LOOKBACK); p--) {
        if (metaFlags[p]) {
          metaFlags[n - 1] = true;
          break;
        }
      }
    }

    for (let n = block.startLine; n <= block.endLine; n++) {
      const line = lines[n - 1];

      if (ESCAPE_MARKER_RE.test(line)) continue;
      if (regionExcluded.has(n)) continue;
      if (isQuotedEnumerationLine(line)) continue;
      if (metaFlags[n - 1]) continue;

      for (const { word, re } of patterns) {
        const idx = line.search(re);
        if (idx < 0) continue;

        const start = Math.max(0, idx - 20);
        const end = Math.min(line.length, idx + word.length + 60);
        const snippet = line.slice(start, end).trim();
        violations.push({ file: relPath, line: n, word, snippet });
      }
    }
  }

  return violations;
}

// ---------------------------------------------------------------------------
// Block-tagged region scanner (Wave-1b.5)
// ---------------------------------------------------------------------------
// Complements the file-level scan. Authors tag a prompt-body constant with
//
//     // @prompt-block <BLOCK_ID>
//     const bodyTemplate = `...multi-line prompt content...`;
//
// The PROMPT_BLOCK_DECLARATIONS registry declares the contract level for
// each blockId (descriptive / evaluative / prescriptive). If the level is
// 'descriptive', the template literal below the tag is scanned with the
// same forbidden-vocabulary rules as the L1/L3/L3.75 file-level scan — even
// when the block lives in a file outside TARGET_FILES.
//
// Unknown block IDs are lint failures (the author forgot to claim a slot
// in PROMPT_BLOCK_VERSIONS).

// Anchored to start-of-line (tolerating leading whitespace) so that jsdoc
// lines like " *     // @prompt-block ..." do NOT match — those are doc
// examples, not real authored blocks.
const BLOCK_TAG_RE = /^\s*\/\/\s*@prompt-block\s+([A-Z][A-Z0-9_]*)/;

/** Directories (relative to repo root) to walk for @prompt-block tags. */
const BLOCK_SCAN_ROOTS = ['src'];

/** Skip these path segments entirely. */
const SCAN_SKIP_SEGMENTS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.turbo',
]);

function walkTsFiles(root: string): string[] {
  const out: string[] = [];
  function recur(dir: string): void {
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SCAN_SKIP_SEGMENTS.has(entry.name)) continue;
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        recur(full);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        if (entry.name.endsWith('.d.ts')) continue;
        out.push(full);
      }
    }
  }
  recur(root);
  return out;
}

interface TaggedBlock {
  /** 1-based line of the @prompt-block comment. */
  tagLine: number;
  blockId: string;
  /** 1-based line where the bound template literal opens. */
  startLine: number;
  /** 1-based line where the bound template literal closes. */
  endLine: number;
}

/**
 * For each `// @prompt-block ID` tag, find the next template literal in
 * source and bind it to the tag. Scans both top-level assignments and
 * expressions (e.g., literal passed as an argument).
 */
function extractTaggedBlocks(source: string): TaggedBlock[] {
  const lines = source.split('\n');
  const blocks: TaggedBlock[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(BLOCK_TAG_RE);
    if (!match) continue;

    const blockId = match[1];
    const tagLine = i + 1;

    // Scan forward up to 5 lines for the opening backtick of a template
    // literal. This tolerates multi-line signatures / comments between the
    // tag and the literal.
    const LOOKAHEAD = 5;
    let openRow = -1;
    let openCol = -1;
    outer: for (let r = i + 1; r <= Math.min(i + LOOKAHEAD, lines.length - 1); r++) {
      const col = lines[r].indexOf('`');
      if (col !== -1) {
        openRow = r;
        openCol = col;
        break outer;
      }
    }

    if (openRow === -1) {
      // Author forgot to put a template literal after the tag. Record
      // with startLine=endLine=tagLine so the caller reports a violation.
      blocks.push({ tagLine, blockId, startLine: tagLine, endLine: tagLine });
      continue;
    }

    // Walk to the closing backtick, respecting ${...} nesting.
    let endRow = -1;
    let col = openCol + 1;
    let depth = 0;
    walk: for (let r = openRow; r < lines.length; r++) {
      const ln = lines[r];
      while (col < ln.length) {
        const ch = ln[col];
        const prev = col > 0 ? ln[col - 1] : '';
        if (ch === '{' && prev === '$') {
          depth++;
          col++;
          continue;
        }
        if (ch === '}' && depth > 0) {
          depth--;
          col++;
          continue;
        }
        if (ch === '`' && depth === 0 && prev !== '\\') {
          endRow = r;
          break walk;
        }
        col++;
      }
      col = 0;
    }

    if (endRow === -1) {
      blocks.push({ tagLine, blockId, startLine: openRow + 1, endLine: openRow + 1 });
      continue;
    }

    blocks.push({
      tagLine,
      blockId,
      startLine: openRow + 1,
      endLine: endRow + 1,
    });
    i = endRow; // skip past the literal we just consumed
  }

  return blocks;
}

function scanTaggedBlock(
  lines: string[],
  block: TaggedBlock,
  relPath: string,
): { violations: Violation[]; unknownId: boolean; missingLiteral: boolean } {
  if (!isKnownBlockId(block.blockId)) {
    return {
      violations: [{
        file: relPath,
        line: block.tagLine,
        word: block.blockId,
        snippet: `unknown blockId '${block.blockId}' — claim a slot in PROMPT_BLOCK_VERSIONS first`,
      }],
      unknownId: true,
      missingLiteral: false,
    };
  }

  if (block.startLine === block.tagLine) {
    return {
      violations: [{
        file: relPath,
        line: block.tagLine,
        word: block.blockId,
        snippet: `@prompt-block ${block.blockId} is not followed by a template literal within 5 lines`,
      }],
      unknownId: false,
      missingLiteral: true,
    };
  }

  const level = PROMPT_BLOCK_DECLARATIONS[block.blockId as PromptBlockId].level;
  if (level !== 'descriptive') {
    // Evaluative / prescriptive blocks are exempt from forbidden-vocabulary
    // scanning — that's what those contract levels mean.
    return { violations: [], unknownId: false, missingLiteral: false };
  }

  const patterns = FORBIDDEN_WORDS.map(w => ({ word: w, re: buildWordPattern(w) }));
  const violations: Violation[] = [];

  // Reuse the same exclusion heuristics the file-level scan uses, but in
  // micro-scope (the single template literal). We build a fake PromptBlock
  // for computeRegionExclusions.
  const fakeBlock: PromptBlock = {
    startLine: block.startLine,
    endLine: block.endLine,
    identifier: `@prompt-block:${block.blockId}`,
  };
  const regionExcluded = computeRegionExclusions(lines, fakeBlock);

  // Pre-compute meta flags (negative-example / taxonomy-label lines).
  const metaFlags: boolean[] = new Array(lines.length).fill(false);
  for (let n = block.startLine; n <= block.endLine; n++) {
    metaFlags[n - 1] = isMetaLine(lines[n - 1]);
  }
  const GLOSS_LOOKBACK = 6;
  for (let n = block.startLine; n <= block.endLine; n++) {
    if (!GLOSS_RE.test(lines[n - 1])) continue;
    for (let p = n - 2; p >= Math.max(block.startLine - 1, n - 2 - GLOSS_LOOKBACK); p--) {
      if (metaFlags[p]) {
        metaFlags[n - 1] = true;
        break;
      }
    }
  }

  for (let n = block.startLine; n <= block.endLine; n++) {
    const line = lines[n - 1];
    if (ESCAPE_MARKER_RE.test(line)) continue;
    if (regionExcluded.has(n)) continue;
    if (isQuotedEnumerationLine(line)) continue;
    if (metaFlags[n - 1]) continue;

    for (const { word, re } of patterns) {
      const idx = line.search(re);
      if (idx < 0) continue;
      const start = Math.max(0, idx - 20);
      const end = Math.min(line.length, idx + word.length + 60);
      const snippet = line.slice(start, end).trim();
      violations.push({ file: relPath, line: n, word, snippet });
    }
  }

  return { violations, unknownId: false, missingLiteral: false };
}

interface TaggedScanResult {
  violations: Violation[];
  filesWithTags: number;
  taggedBlocks: number;
  unknownIds: number;
  missingLiterals: number;
}

function scanAllTaggedBlocks(repoRoot: string): TaggedScanResult {
  const result: TaggedScanResult = {
    violations: [],
    filesWithTags: 0,
    taggedBlocks: 0,
    unknownIds: 0,
    missingLiterals: 0,
  };

  for (const rel of BLOCK_SCAN_ROOTS) {
    const abs = resolve(repoRoot, rel);
    const files = walkTsFiles(abs);
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      // Cheap pre-filter: only parse files that contain the tag substring.
      // The real per-line anchored match happens inside extractTaggedBlocks.
      if (!source.includes('@prompt-block')) continue;

      const lines = source.split('\n');
      const blocks = extractTaggedBlocks(source);
      if (blocks.length === 0) continue;

      const relPath = relative(repoRoot, file).split(sep).join('/');
      result.filesWithTags++;
      result.taggedBlocks += blocks.length;

      for (const block of blocks) {
        const scan = scanTaggedBlock(lines, block, relPath);
        result.violations.push(...scan.violations);
        if (scan.unknownId) result.unknownIds++;
        if (scan.missingLiteral) result.missingLiterals++;
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const repoRoot = resolve(__dirname, '..', '..');
  const allViolations: Violation[] = [];
  let blocksScanned = 0;

  for (const rel of TARGET_FILES) {
    const abs = resolve(repoRoot, rel);
    const source = readFileSync(abs, 'utf8');
    const blocks = extractPromptBlocks(source);
    blocksScanned += blocks.length;
    const viols = scanFile(abs, rel);
    allViolations.push(...viols);
  }

  const taggedResult = scanAllTaggedBlocks(repoRoot);
  allViolations.push(...taggedResult.violations);

  if (allViolations.length === 0) {
    console.log('[descriptive-contract-lint] PASS');
    console.log(`  Files scanned:   ${TARGET_FILES.length}`);
    console.log(`  Prompt blocks:   ${blocksScanned}`);
    console.log(`  Tagged blocks:   ${taggedResult.taggedBlocks} in ${taggedResult.filesWithTags} file(s)`);
    console.log(`  Violations:      0`);
    process.exit(0);
  }

  console.error('[descriptive-contract-lint] FAIL');
  console.error(`  Files scanned:   ${TARGET_FILES.length}`);
  console.error(`  Prompt blocks:   ${blocksScanned}`);
  console.error(`  Tagged blocks:   ${taggedResult.taggedBlocks} in ${taggedResult.filesWithTags} file(s)`);
  if (taggedResult.unknownIds > 0) {
    console.error(`  Unknown IDs:     ${taggedResult.unknownIds} (claim a slot in src/lib/llm/promptBlockVersions.ts)`);
  }
  if (taggedResult.missingLiterals > 0) {
    console.error(`  Missing literals: ${taggedResult.missingLiterals} (@prompt-block tag not followed by a template literal)`);
  }
  console.error(`  Violations:      ${allViolations.length}`);
  console.error('');
  for (const v of allViolations) {
    console.error(`  ${v.file}:${v.line}: "${v.word}"  —  ${v.snippet}`);
  }
  console.error('');
  console.error('L1 / L3 / L3.75 prompts and descriptive-level tagged blocks are');
  console.error('DESCRIPTIVE ONLY. To allow a specific line that legitimately');
  console.error('references forbidden vocabulary, add this inline marker:');
  console.error('  // @descriptive-contract-ok: <short reason>');
  console.error('See docs/V1_KNOWLEDGE_ABSORPTION_VERDICT.md Section 4 Pre-req 4.');
  process.exit(1);
}

main();
