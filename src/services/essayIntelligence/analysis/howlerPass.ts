/**
 * howlerPass.ts — Phase 4.1: cheap quality-floor pass that catches the
 * essay-specific howlers neither the OLD nor V2 systems flagged in the
 * reference audit.
 *
 * WHY THIS EXISTS
 *   The V2 blind-spot hunter found three specific howlers on the piano
 *   essay that NEITHER system caught:
 *
 *     1. "Seven notes" — factually wrong (Western music has 12 pitch classes).
 *        The opening's hook is literally inaccurate.
 *     2. "Make a meaningful difference — much like composing a timeless melody"
 *        — peak-Hallmark landing, pure cliché.
 *     3. P5 and P6 are ~80% verbatim rewording of each other — a structural
 *        redundancy the student would catch on re-read but no analysis layer
 *        surfaces.
 *
 *   The existing pipeline can't reliably catch these because they're
 *   surface-level noise to a deep-reader but glaring to a first-reader
 *   (like an AO). This module adds a cheap, deterministic check that runs
 *   essay-wide and emits `MUST_ADDRESS` improvement candidates for each hit.
 *
 * DESIGN
 *   - Pure TypeScript, zero LLM calls.
 *   - Three detectors, composable:
 *       detectClicheBigrams(text): scan against a curated blocklist
 *       detectDuplicateParagraphs(paragraphs): Jaccard similarity over shingles
 *       detectFactualHooks(text): flag specific known-wrong claims (extensible)
 *   - Each detector returns a list of `Howler` descriptors with enough
 *     context for downstream consumers (L4, the coach, the scorecard) to
 *     surface them prominently.
 *
 *   The factual detector ships with a small initial set (music theory,
 *   physics) and is designed to grow. Each entry has an issue string and
 *   the correction; extend by appending to FACTUAL_CLAIMS.
 *
 * CONSUMERS
 *   - buildImprovementManifest (future): merge HOWLER results into
 *     manifest items with `impact: 'transformative'` and source='howler'.
 *   - audit scorecard: count howlers caught, surface as quality gate.
 *   - replay test: unit-test against fixtures.
 */

export type HowlerKind = 'cliche' | 'duplicate_paragraph' | 'factual_hook';

export interface Howler {
  kind: HowlerKind;
  /** Student-facing description of the issue */
  description: string;
  /** Position in essay (character offset, or paragraph indices) */
  location:
    | { type: 'essay_range'; start: number; end: number }
    | { type: 'paragraph'; index: number }
    | { type: 'paragraph_pair'; a: number; b: number; similarity: number };
  /** Exact text that triggered the howler */
  evidence: string;
  /** Recommended fix (student-facing, brief) */
  suggestion: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLICHÉ BLOCKLIST
//
// Curated from the audit's blind-spot hunter + known college-essay
// convergence phrases. Each entry is a case-insensitive substring match —
// bigrams and short phrases are deliberately prioritized over whole-sentence
// patterns so we catch variations.
//
// Extension rule: add phrases here when an audit surfaces a new convergence
// signal. Keep entries ≤5 words to prevent over-specific matching.
// ═══════════════════════════════════════════════════════════════════════════

export const CLICHE_PHRASES: readonly string[] = [
  // Aspirational / landing-sentence clichés
  'make a meaningful difference',
  'make a difference',
  'timeless melody',
  'limitless possibilities',
  'endless possibilities',
  'find my passion',
  'pursue my passion',
  'my true calling',
  'changed my life',
  'changed my perspective',
  'open new doors',
  'open doors',
  'this experience taught me',
  'i learned that',
  'i realized that',
  'shaped who i am',
  'made me who i am',
  'defined me',
  'became my anchor',
  'became my refuge',
  'found my voice',
  // Sensory-writing crutches
  'fingers danced',
  'eyes sparkled',
  'heart raced',
  'butterflies in my stomach',
  'my heart sank',
  'a wave of emotion',
  // Music/arts convergence
  'create worlds through sound',
  'captivated by the power',
  'magic of music',
  'melodies that tell stories',
  // STEM convergence
  'deepened my passion for stem',
  'fell in love with coding',
  'a lightbulb went off',
  'i was hooked',
  // Overcoming-adversity convergence
  'rose above',
  'never gave up',
  'beat the odds',
  'overcame my fears',
  // Philosophy-paper convergence
  'realized the importance of',
  'the beauty of',
  'the power of',
  'taught me the value of',
  'the true meaning of',
];

export function detectClicheBigrams(text: string): Howler[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const howlers: Howler[] = [];
  for (const phrase of CLICHE_PHRASES) {
    let idx = 0;
    while ((idx = lower.indexOf(phrase, idx)) !== -1) {
      howlers.push({
        kind: 'cliche',
        description: `Convergence-zone phrase: "${phrase}"`,
        location: { type: 'essay_range', start: idx, end: idx + phrase.length },
        evidence: text.slice(Math.max(0, idx - 20), Math.min(text.length, idx + phrase.length + 20)),
        suggestion: 'Replace with a concrete detail that only YOU could have written — a specific moment, object, or sensation.',
      });
      idx += phrase.length;
    }
  }
  return howlers;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEAR-DUPLICATE PARAGRAPH DETECTOR
//
// Jaccard similarity over word shingles (3-grams). A threshold of 0.45+
// flags paragraphs that are saying substantially the same thing, even with
// different wording. In the audit this would have caught the P5↔P6 redundancy
// the analysis layer missed.
//
// Implementation: pure TypeScript, no external dependencies. O(N²) paragraph
// comparisons — fine for <20 paragraphs.
// ═══════════════════════════════════════════════════════════════════════════

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function wordShingles(tokens: string[], n: number): Set<string> {
  const shingles = new Set<string>();
  for (let i = 0; i + n <= tokens.length; i++) {
    shingles.add(tokens.slice(i, i + n).join(' '));
  }
  return shingles;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Paragraph-similarity signal: blend of 2-gram jaccard (phrase overlap)
 * and unigram jaccard (vocabulary overlap). This catches both "same
 * phrases, same order" (high bigram) and "same vocab, reordered"
 * (high unigram, lower bigram). Weighted 60/40 in favor of bigrams since
 * phrase overlap is a stronger redundancy signal than shared vocab.
 */
function paragraphSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const bigramA = wordShingles(ta, 2);
  const bigramB = wordShingles(tb, 2);
  const unigramA = new Set(ta);
  const unigramB = new Set(tb);
  const bigram = jaccard(bigramA, bigramB);
  const unigram = jaccard(unigramA, unigramB);
  return bigram * 0.6 + unigram * 0.4;
}

export function detectDuplicateParagraphs(
  paragraphs: string[],
  threshold = 0.4,
): Howler[] {
  const howlers: Howler[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    for (let j = i + 1; j < paragraphs.length; j++) {
      const sim = paragraphSimilarity(paragraphs[i], paragraphs[j]);
      if (sim >= threshold) {
        howlers.push({
          kind: 'duplicate_paragraph',
          description: `P${i + 1} and P${j + 1} share ${(sim * 100).toFixed(0)}% vocabulary/phrasing — risk of structural redundancy.`,
          location: { type: 'paragraph_pair', a: i, b: j, similarity: sim },
          evidence: `P${i + 1}: "${paragraphs[i].slice(0, 80)}..." | P${j + 1}: "${paragraphs[j].slice(0, 80)}..."`,
          suggestion: `Consider consolidating P${i + 1} and P${j + 1} or giving one of them a distinct function (e.g., one scene-demonstrates, the other structurally-reframes).`,
        });
      }
    }
  }
  return howlers;
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTUAL HOOK DETECTOR
//
// Small static table of known-wrong claims that college essays recycle. This
// is NOT a general-purpose fact checker — it's a cheap regex scan for
// specific howlers we've seen repeatedly. Extend as new ones surface.
//
// Each entry has:
//   - `pattern`: regex to detect the claim
//   - `issue`: what's wrong
//   - `correction`: the accurate version (student-facing)
// ═══════════════════════════════════════════════════════════════════════════

interface FactualClaim {
  pattern: RegExp;
  issue: string;
  correction: string;
}

export const FACTUAL_CLAIMS: readonly FactualClaim[] = [
  {
    pattern: /\bjust seven notes\b|\bonly seven notes\b|\bwith (?:just|only) seven notes\b/i,
    issue: 'Claims "seven notes" as the full vocabulary of Western music.',
    correction: 'Western music has twelve pitch classes (chromatic scale). Seven is the diatonic scale — one particular subset. If the point is creative constraint, name the specific scale; if the point is the full vocabulary, say twelve.',
  },
  {
    pattern: /\b(?:sound travels|speed of sound).{0,20}\b(?:770|760|750)\s*(?:mph|miles)\b/i,
    issue: 'Cites a specific speed-of-sound number.',
    correction: 'Speed of sound varies with temperature/altitude — ~343 m/s (767 mph) at sea level 20°C. Either drop the number or name the conditions.',
  },
  {
    pattern: /\bneurons? fir(?:e|ed|ing) at (?:light|the speed of light)\b/i,
    issue: 'Claims neurons fire at the speed of light.',
    correction: 'Neural signals propagate at ~100 m/s on myelinated axons — fast, but not light-speed (3e8 m/s is 3 million times faster).',
  },
  {
    pattern: /\bwe only use 10%?\s*(?:percent)?\s*of our brains?\b/i,
    issue: '"Only 10% of our brain" is a pop-science myth.',
    correction: 'fMRI studies show nearly all brain regions activate across the day. The "10%" claim is folklore with no research basis.',
  },
];

export function detectFactualHooks(text: string): Howler[] {
  if (!text) return [];
  const howlers: Howler[] = [];
  for (const claim of FACTUAL_CLAIMS) {
    const match = claim.pattern.exec(text);
    if (match && match.index !== undefined) {
      howlers.push({
        kind: 'factual_hook',
        description: claim.issue,
        location: { type: 'essay_range', start: match.index, end: match.index + match[0].length },
        evidence: text.slice(Math.max(0, match.index - 30), Math.min(text.length, match.index + match[0].length + 30)),
        suggestion: claim.correction,
      });
    }
  }
  return howlers;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSITE PASS
// ═══════════════════════════════════════════════════════════════════════════

export interface HowlerPassResult {
  howlers: Howler[];
  counts: Record<HowlerKind, number>;
  essayWordCount: number;
}

/**
 * Run all three detectors and return a combined result. Paragraph array is
 * required for the duplicate detector; pass [essayText] to only do single-
 * paragraph essays.
 */
export function runHowlerPass(
  essayText: string,
  paragraphs: string[],
): HowlerPassResult {
  const cliches = detectClicheBigrams(essayText);
  const duplicates = detectDuplicateParagraphs(paragraphs);
  const factuals = detectFactualHooks(essayText);
  const all = [...cliches, ...duplicates, ...factuals];

  const counts: Record<HowlerKind, number> = {
    cliche: cliches.length,
    duplicate_paragraph: duplicates.length,
    factual_hook: factuals.length,
  };
  const essayWordCount = essayText.split(/\s+/).filter(Boolean).length;

  return { howlers: all, counts, essayWordCount };
}
