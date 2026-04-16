/**
 * Edit Understanding Service — Focused Change Impact Classifier
 *
 * Produces nuanced understanding of what an edit means in the context of the
 * essay's existing profile. Designed for the focused-analysis pipeline where
 * students make incremental changes and the system must decide whether to do
 * sentence-level updates, paragraph reanalysis, or trigger comprehensive reanalysis.
 *
 * Three-stage pipeline:
 *   Step 0 — Mechanical diff (no LLM): paragraph alignment, sentence alignment,
 *             word-level diff, reorder detection.
 *   Step 1 — Haiku triviality pre-filter (~$0.001): binary TRIVIAL vs REAL gate.
 *             Biased toward REAL to prevent lost understanding.
 *   Step 2-4 — Sonnet understanding (~$0.02-0.05): JSON-mode structured output with
 *              inline reasoning through significance anchors → profile impact mapping →
 *              scope recommendation. Produces EditUnderstandingOutput with StalenessEffect[].
 *
 * Key quality controls:
 *   - useJsonMode: true forces valid JSON output; reasoning embedded in JSON fields
 *     (significanceReasoning, profileImpact.directImpact, scopeRecommendation.reasoning)
 *   - Calibrated significance anchors (TRANSFORMATIVE/SIGNIFICANT/MODERATE/MINOR/TRIVIAL)
 *     with concrete essay examples
 *   - Anti-fabrication instruction: "if contained to one sentence with no ripple, SAY SO"
 *   - Unaffected areas list (3-5 entries) prevents lazy "everything might be affected" responses
 *   - Haiku repair fallback if primary JSON parse fails
 *
 * Consumed by: focused analysis pipeline, EssayProfileCoordinator.applyEditUnderstanding()
 * Spec: PLAN.md (focused analysis mode, impact classification)
 */

import type {
  EssayProfile,
  EditDiff,
  EditUnderstanding,
  EditUnderstandingOutput,
  StalenessEffect,
  StalenessTarget,
  StalenessStrength,
  HolisticSectionType,
  EditChangeType,
  StalenessSnapshot,
} from '../profileTypes';

import { ProfileRouter } from '../profileManager/profileRouter';
import { callClaude, calculateCost } from '../../../lib/llm/claude';
import type { ClaudeResponse } from '../../../lib/llm/claude';
import type { LayerCost, TokenUsage } from './analysisOrchestrator';

import { jsonrepair } from 'jsonrepair';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU = 'claude-haiku-4-5-20251001';
const SONNET = 'claude-sonnet-4-5-20250929';

const FILTER_MAX_TOKENS = 256;
const UNDERSTANDING_MAX_TOKENS = 2048;

const FILTER_TEMPERATURE = 0.1;
const UNDERSTANDING_TEMPERATURE = 0.3;

const FILTER_TIMEOUT_MS = 30_000;
const UNDERSTANDING_TIMEOUT_MS = 90_000;

// ============================================================================
// RESULT TYPE
// ============================================================================

export interface EditUnderstandingResult {
  /** The structured output consumed by the coordinator */
  output: EditUnderstandingOutput;
  /** Per-call cost tracking */
  cost: LayerCost;
  /** Whether the triviality filter short-circuited the pipeline */
  trivialFilter: {
    wasFiltered: boolean;
    reason?: string;
  };
}

// ============================================================================
// INTERNAL TYPES (raw LLM output before mapping)
// ============================================================================

interface HaikuFilterRaw {
  classification: 'TRIVIAL' | 'REAL';
  reason: string;
}

interface ConnectionImpactItem {
  connectionId: string;
  effect: 'altered' | 'strengthened' | 'weakened' | 'broken' | 'unchanged';
  reasoning: string;
}

interface SonnetUnderstandingRaw {
  significance: 'minor' | 'moderate' | 'significant' | 'transformative';
  significanceReasoning: string;
  /**
   * Primary change type — used for downstream routing.
   * May also appear as `changeTypes` (array) when the LLM reports multiple dimensions.
   */
  changeType: EditChangeType;
  /** Multi-dimensional change types (preferred over singular `changeType` when present) */
  changeTypes?: EditChangeType[];
  apparentPurpose: string;
  purposeConfidence: number;
  profileImpact: {
    directImpact: string;
    connectionImpact: ConnectionImpactItem[];
    paragraphImpact: string | null;
    holisticImpact: string | null;
    /**
     * Canonical holistic section keys — LLM outputs these directly so we don't
     * need brittle keyword matching. Falls back to keyword matching if absent/invalid.
     */
    holisticSections?: string[];
  };
  scopeRecommendation: {
    scope: 'sentence_update' | 'paragraph_reanalysis' | 'targeted_holistic_refresh' | 'comprehensive';
    reasoning: string;
    targets: string[];
  };
  unaffectedAreas: string[];
}

// ============================================================================
// STEP 0: MECHANICAL DIFF (NO LLM)
// ============================================================================

/**
 * Simple string hash for paragraph identity comparison.
 * Fast O(n) hash — not cryptographic, just for change detection.
 */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Sentence splitter that handles common abbreviations (Mr., Dr., U.S., etc.)
 * and decimal numbers so they don't cause false sentence boundaries.
 */
function splitSentences(text: string): string[] {
  // Step 1: Protect common abbreviations by replacing their dots with a sentinel.
  // Using \x01 as a safe sentinel that won't appear in essay text.
  const protected1 = text.replace(
    /\b(Dr|Mr|Mrs|Ms|Prof|Jr|Sr|U\.S|e\.g|i\.e|vs|etc|et al)\./gi,
    (m) => m.slice(0, -1) + '\x01'
  );
  // Step 2: Protect decimal numbers (e.g., "3.8 GPA").
  const protected2 = protected1.replace(/(\d)\.(\d)/g, '$1\x02$2');
  // Step 3: Split on sentence-ending punctuation followed by whitespace and a capital or quote.
  const sentences = protected2.split(/(?<=[.!?])\s+(?=[A-Z"'])/);
  // Step 4: Restore sentinels and filter empties.
  return sentences
    .map(s => s.replace(/\x01/g, '.').replace(/\x02/g, '.').trim())
    .filter(s => s.length > 0);
}

/**
 * Split essay text into paragraphs on double newlines.
 * Filters out empty strings resulting from extra whitespace.
 */
function splitParagraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
}

/**
 * Compute text overlap ratio between two strings (Jaccard on word sets).
 * Used for sentence alignment within changed paragraphs.
 */
function overlapRatio(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

/**
 * LCS-based word diff between two sentences.
 * Returns array of {type, text} tokens representing added/removed/unchanged words.
 */
function computeWordDiff(
  oldText: string,
  newText: string
): Array<{ type: 'added' | 'removed' | 'unchanged'; text: string }> {
  const oldWords = oldText.split(/\s+/).filter(w => w.length > 0);
  const newWords = newText.split(/\s+/).filter(w => w.length > 0);

  // Build LCS table
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Trace back to build diff
  const result: Array<{ type: 'added' | 'removed' | 'unchanged'; text: string }> = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: 'unchanged', text: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', text: newWords[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', text: oldWords[i - 1] });
      i--;
    }
  }

  return result;
}

/**
 * Compute paragraph-level and sentence-level diff between two essay versions.
 * Pure TypeScript — no LLM calls.
 *
 * When a profile is provided, its pre-split sentence arrays are used for old
 * paragraphs (M2 fix: ensures sentence boundaries match the profile's source
 * of truth rather than re-splitting with a potentially inconsistent regex).
 * The profile's sentences are the canonical boundaries established by L1.
 */
function computeEditDiff(
  oldText: string,
  newText: string,
  profile?: Readonly<EssayProfile>,
): EditDiff {
  const oldParas = splitParagraphs(oldText);
  const newParas = splitParagraphs(newText);

  // Build hash → indices map for old paragraphs (for reorder/duplicate detection).
  // Use Map<number, number[]> so duplicate paragraphs (same hash) all get tracked.
  const oldHashToIndices = new Map<number, number[]>();
  for (let i = 0; i < oldParas.length; i++) {
    const h = hashString(oldParas[i]);
    const bucket = oldHashToIndices.get(h);
    if (bucket) {
      bucket.push(i);
    } else {
      oldHashToIndices.set(h, [i]);
    }
  }

  const newHashes = newParas.map(p => hashString(p));

  // Detect unchanged paragraphs (same hash = same content).
  // When multiple old paragraphs share the same hash, prefer the positionally closest match.
  const unchangedOldIndices = new Set<number>();
  const unchangedNewIndices = new Set<number>();

  for (let ni = 0; ni < newHashes.length; ni++) {
    const h = newHashes[ni];
    const candidates = oldHashToIndices.get(h);
    if (!candidates || candidates.length === 0) continue;

    // Among unconsumed candidates, pick the one positionally closest to ni.
    const available = candidates.filter(oi => !unchangedOldIndices.has(oi));
    if (available.length === 0) continue;

    // Prefer closest positional match.
    const best = available.reduce((prev, curr) =>
      Math.abs(curr - ni) < Math.abs(prev - ni) ? curr : prev
    );

    unchangedOldIndices.add(best);
    unchangedNewIndices.add(ni);
  }

  // Detect reordering: same content at different positions.
  // Use the same positional-matching logic as above.
  let paragraphsReordered = false;
  const reorderConsumed = new Set<number>();
  for (let ni = 0; ni < newHashes.length; ni++) {
    const h = newHashes[ni];
    const candidates = oldHashToIndices.get(h);
    if (!candidates) continue;
    const available = candidates.filter(oi => !reorderConsumed.has(oi));
    if (available.length === 0) continue;
    const best = available.reduce((prev, curr) =>
      Math.abs(curr - ni) < Math.abs(prev - ni) ? curr : prev
    );
    reorderConsumed.add(best);
    if (best !== ni) {
      paragraphsReordered = true;
      break;
    }
  }

  // Paragraphs added: new indices not in unchanged set
  const paragraphsAdded: number[] = [];
  for (let ni = 0; ni < newParas.length; ni++) {
    if (!unchangedNewIndices.has(ni)) {
      paragraphsAdded.push(ni);
    }
  }

  // Paragraphs removed: old indices not in unchanged set
  const paragraphsRemoved: number[] = [];
  for (let oi = 0; oi < oldParas.length; oi++) {
    if (!unchangedOldIndices.has(oi)) {
      paragraphsRemoved.push(oi);
    }
  }

  const paragraphDelta = newParas.length - oldParas.length;

  // Per-paragraph changes: align changed paragraphs by position + content similarity.
  // Strategy: pair old/new changed paragraphs by the best positional+overlap match.
  // This prevents middle insertions from misaligning all subsequent pairings.
  const paragraphChanges: EditDiff['paragraphChanges'] = [];

  let totalSentencesChanged = 0;
  let totalWordsChanged = 0;

  // Build per-paragraph sentence-level diff for changed paragraphs.
  // Pair old removed paragraphs with new added paragraphs using similarity gating:
  // only treat two paragraphs as a "modification" if they share >30% word overlap.
  // Below that threshold, treat them as independent deletion + addition.
  const changedOldIndices = paragraphsRemoved;
  const changedNewIndices = paragraphsAdded;

  // Build a greedy pairing: for each new index, find the best old index match.
  // An old index can only be paired once.
  const pairedOld = new Set<number>();
  const pairedNew = new Set<number>();
  const pairs: Array<{ oldIdx: number; newIdx: number }> = [];

  for (const newIdx of changedNewIndices) {
    let bestOldIdx: number | undefined;
    let bestOverlap = 0.30; // minimum 30% overlap required to be considered a modification

    for (const oldIdx of changedOldIndices) {
      if (pairedOld.has(oldIdx)) continue;
      const overlap = overlapRatio(oldParas[oldIdx], newParas[newIdx]);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestOldIdx = oldIdx;
      }
    }

    if (bestOldIdx !== undefined) {
      pairs.push({ oldIdx: bestOldIdx, newIdx });
      pairedOld.add(bestOldIdx);
      pairedNew.add(newIdx);
    }
  }

  // Process paired modifications
  for (const { oldIdx, newIdx } of pairs) {
    // M2 fix: Use profile's pre-split sentences for old paragraphs when available.
    // The profile's sentence arrays are the canonical boundaries from L1.
    // Fall back to splitSentences() for raw text (e.g., no profile or index mismatch).
    const profileOldSentences = profile?.paragraphs[oldIdx]?.sentences;
    const oldSentences = profileOldSentences && profileOldSentences.length > 0
      ? profileOldSentences.map(s => s.text)
      : splitSentences(oldParas[oldIdx]);
    const newSentences = splitSentences(newParas[newIdx]);
    const sentenceChanges: EditDiff['paragraphChanges'][0]['sentenceChanges'] = [];
    const maxS = Math.max(oldSentences.length, newSentences.length);
    for (let si = 0; si < maxS; si++) {
      const oldS = oldSentences[si];
      const newS = newSentences[si];
      if (oldS === undefined) {
        sentenceChanges.push({ sentenceIndex: si, changeType: 'added', newText: newS });
        totalSentencesChanged++;
      } else if (newS === undefined) {
        sentenceChanges.push({ sentenceIndex: si, changeType: 'removed', oldText: oldS });
        totalSentencesChanged++;
      } else if (oldS === newS) {
        sentenceChanges.push({ sentenceIndex: si, changeType: 'unchanged', oldText: oldS, newText: newS });
      } else {
        const wordDiff = computeWordDiff(oldS, newS);
        const changedWords = wordDiff.filter(w => w.type !== 'unchanged').length;
        totalWordsChanged += changedWords;
        totalSentencesChanged++;
        sentenceChanges.push({ sentenceIndex: si, changeType: 'modified', oldText: oldS, newText: newS, wordDiff });
      }
    }
    paragraphChanges.push({ paragraphIndex: newIdx, changeType: 'modified', sentenceChanges });
  }

  // Process unpaired removals (old paragraphs with no matching new paragraph)
  for (const oldIdx of changedOldIndices) {
    if (!pairedOld.has(oldIdx)) {
      paragraphChanges.push({ paragraphIndex: oldIdx, changeType: 'removed', sentenceChanges: [] });
    }
  }

  // Process unpaired additions (new paragraphs with no matching old paragraph)
  for (const newIdx of changedNewIndices) {
    if (!pairedNew.has(newIdx)) {
      const newSentences = splitSentences(newParas[newIdx]);
      const sentenceChanges = newSentences.map((s, si) => ({
        sentenceIndex: si,
        changeType: 'added' as const,
        newText: s,
      }));
      totalSentencesChanged += newSentences.length;
      paragraphChanges.push({ paragraphIndex: newIdx, changeType: 'added', sentenceChanges });
    }
  }

  const totalWords = oldText.split(/\s+/).length;
  const changeRatio = totalWords > 0 ? totalWordsChanged / totalWords : 0;

  return {
    structural: {
      paragraphsAdded,
      paragraphsRemoved,
      paragraphsReordered,
      paragraphDelta,
    },
    paragraphChanges,
    stats: {
      totalSentencesChanged,
      totalWordsChanged,
      changeRatio,
    },
  };
}

// ============================================================================
// STEP 1: HAIKU TRIVIALITY PRE-FILTER
// ============================================================================

const FILTER_SYSTEM_PROMPT = `You are a binary classifier with a bias toward REAL.

Your job is to decide whether an essay edit requires LLM understanding work.

THE KEY TEST: Would an admissions officer reading this essay notice a difference in how they EXPERIENCE the applicant? Does it change what they KNOW about this person, how MEMORABLE the moment is, or how AUTHENTIC the voice feels?

CLASSIFICATION BOUNDARY EXAMPLES:

TRIVIAL examples (mechanical — no understanding update needed):
1. "recieve" → "receive" (spelling fix, meaning unchanged)
2. "I went to the store. I bought milk." → "I went to the store; I bought milk." (punctuation only)
3. "color" → "colour" (spelling variant, meaning identical)

REAL examples (requires understanding update, even if small):
1. "I decided to quit" → "I couldn't continue" (agency shift — the essay's theory of character changes)
2. "I was scared" → "My hands wouldn't stop shaking" (telling → showing — emotional authenticity changes)
3. "We worked together for months" → "We worked together for three months every Tuesday" (specificity added — memorability shifts)
4. "beautiful sunset" → "amber light through the blinds" (generic → specific — voice and imagery change)
5. Adding a new sentence that provides context (any content addition is REAL)
6. Removing a sentence (any content removal is REAL — connection graph may break)

BIAS INSTRUCTION: When uncertain, classify as REAL. A false positive (REAL when it's actually trivial) costs ~$0.03 in analysis. A false negative (TRIVIAL when it's actually real) loses understanding forever and degrades coaching quality.

Output JSON only:
{"classification": "TRIVIAL" | "REAL", "reason": "<one sentence explaining the decisive factor>"}`;

/**
 * Haiku triviality filter — gate that prevents LLM work for truly mechanical edits.
 * Returns {isReal: true} for edits that need Sonnet understanding.
 */
async function runTrivialityFilter(
  oldText: string,
  newText: string,
  diff: EditDiff
): Promise<{ isReal: boolean; reason: string; rawResponse: ClaudeResponse<string> }> {
  const userPrompt = `Essay edit to classify:

OLD TEXT (changed portions only):
${diff.paragraphChanges
  .flatMap(pc =>
    pc.sentenceChanges
      .filter(sc => sc.changeType !== 'unchanged')
      .map(sc => `[P${pc.paragraphIndex}S${sc.sentenceIndex}] OLD: ${sc.oldText ?? '(none)'} | NEW: ${sc.newText ?? '(none)'}`)
  )
  .join('\n') || `OLD:\n${oldText}\n\nNEW:\n${newText}`}

Change stats: ${diff.stats.totalSentencesChanged} sentence(s) changed, ${diff.stats.totalWordsChanged} word(s) changed.
Paragraphs reordered: ${diff.structural.paragraphsReordered}
Paragraphs added: ${diff.structural.paragraphsAdded.length}, Paragraphs removed: ${diff.structural.paragraphsRemoved.length}

Classify this edit: TRIVIAL or REAL?`;

  const response = await callClaude<string>(userPrompt, {
    model: HAIKU,
    systemPrompt: FILTER_SYSTEM_PROMPT,
    maxTokens: FILTER_MAX_TOKENS,
    temperature: FILTER_TEMPERATURE,
    useJsonMode: false,
    cacheSystemPrompt: true,
    timeoutMs: FILTER_TIMEOUT_MS,
  });

  // Parse response
  const raw = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
  let parsed: HaikuFilterRaw | null = null;

  // Level 1: direct parse
  try {
    parsed = JSON.parse(raw) as HaikuFilterRaw;
  } catch {
    // Level 2: jsonrepair
    try {
      parsed = JSON.parse(jsonrepair(raw)) as HaikuFilterRaw;
    } catch {
      // Level 3: regex extract
      const match = raw.match(/"classification"\s*:\s*"(TRIVIAL|REAL)"[^}]*"reason"\s*:\s*"([^"]+)"/);
      if (match) {
        parsed = { classification: match[1] as 'TRIVIAL' | 'REAL', reason: match[2] };
      }
    }
  }

  // Level 4: default to REAL on parse failure (biased toward understanding)
  if (!parsed || !['TRIVIAL', 'REAL'].includes(parsed.classification)) {
    console.warn('[EditUnderstanding] Filter parse failed — defaulting to REAL');
    return {
      isReal: true,
      reason: 'Filter parse failed — defaulting to REAL for safety',
      rawResponse: response,
    };
  }

  return {
    isReal: parsed.classification === 'REAL',
    reason: parsed.reason,
    rawResponse: response,
  };
}

// ============================================================================
// STEP 2-4: SONNET UNDERSTANDING (SINGLE CALL)
// ============================================================================

const UNDERSTANDING_SYSTEM_PROMPT = `You are an edit impact analyst. Your job is not to re-analyze this essay — the deep profile already did that. Your job is to reason about what THIS SPECIFIC CHANGE does to the existing understanding.

You MUST output ONLY valid JSON — no text before or after. Do all reasoning INSIDE the JSON fields (significanceReasoning, profileImpact.directImpact, scopeRecommendation.reasoning).

---

REASONING GUIDANCE (apply inside the JSON fields):

UNDERSTAND THE CHANGE: In your changeTypes and significanceReasoning fields, state what physically changed and the most precise description of change type(s). A single edit CAN be multiple types simultaneously — e.g., "scared" → "hands shaking" is BOTH meaning_evolution AND tonal_voice_shift. List ALL applicable types in changeTypes, ordered by dominance.

ASSESS SIGNIFICANCE using these calibrated anchors (put your reasoning in significanceReasoning):

TRANSFORMATIVE: Changes thesis, central metaphor, voice identity, or the function of a load-bearing paragraph. Multiple profile sections become stale. North Star may need re-crystallization.
Example: "decided" → "couldn't" in a fulcrum sentence shifts the essay's theory of agency. Profile impact: narrative strategy, character revelation, thematic architecture, and through-line all become stale.

SIGNIFICANT: Alters a paragraph's structural role, breaks or transforms a key connection, or shifts voice register in a way that affects the voice map.
Example: Rewriting the concluding callback to reference a different moment — connection graph changes, structural role shifts.

MODERATE: Changes meaning within a sentence without structural ripple. The sentence's understanding needs updating but paragraph role and connections remain intact.
Example: "I was nervous" → "My voice kept catching on consonants" — emotional authenticity deepens, sentence understanding updates.

MINOR: Improves execution without changing meaning. Sentence understanding stays valid; only surface-level analysis may shift.
Example: "walked" → "drifted" when dreamlike quality was already established.

TRIVIAL: Mechanical fix. No profile impact whatsoever. (Should have been caught by the pre-filter.)

MAP PROFILE IMPACT (put your reasoning in profileImpact.directImpact). Cite specific profile paths. Be surgical.

BAD: "This affects voice."
GOOD: "P2S4's register shifts from contemplative to urgent; voiceMap.shifts may need a new entry or update to shift[1] where the shift was previously marked at P3."

REQUIRED: List 3-5 profile areas that are DEFINITELY UNAFFECTED in the unaffectedAreas array, with brief reasoning per entry. This prevents lazy "everything might be affected" responses.

RECOMMEND SCOPE (put your reasoning in scopeRecommendation.reasoning). Scope MUST follow directly from your impact mapping:
- If mapped impact is ONLY on specific sentences with no structural ripple → scope: sentence_update
- If a paragraph's structural role, earnedness function, or connection points change → scope: paragraph_reanalysis
- If thematic architecture, narrative strategy, voice map, or multiple paragraphs affected → scope: targeted_holistic_refresh
- If North Star, voice identity, or central metaphor affected → scope: comprehensive

ANTI-FABRICATION: If the change is genuinely contained to one sentence with no structural ripple, SAY SO. Do not invent ripple effects to seem thorough. An overstated scope wastes compute and makes the system slower for the student.

---

QUALITY EXAMPLES:

GOOD significanceReasoning:
"MODERATE. 'scared' → 'hands shaking' changes this sentence from emotional assertion to physical grounding. The sentence's understanding must update (observedFunctions: was 'establishes emotional stakes', becomes 'grounds the emotional moment in physical specificity'). The paragraph's structural role (P3: transitional scene-setting) remains unchanged. No connections pass through this sentence in the connection graph."

BAD significanceReasoning:
"The word change is significant because it affects the overall tone." — No specific profile sections cited.

GOOD scopeRecommendation.reasoning:
"sentence_update. Impact is precisely bounded: P3S2's observedFunctions array needs replacement. The paragraph's structural role, the voiceMap, the connection graph (no connections involve P3S2), and all holistic sections are unchanged."

BAD scopeRecommendation.reasoning:
"paragraph_reanalysis because the change may affect how the reader experiences the essay." — Not a profile path, just speculation.`;

/**
 * Build the user prompt for Sonnet understanding, including diff + profile context.
 */
function buildUnderstandingUserPrompt(
  oldText: string,
  newText: string,
  diff: EditDiff,
  assembledContext: { sections: Array<{ name: string; content: unknown }>; estimatedTokens: number },
  conversationContext?: string
): string {
  const changedPortions = diff.paragraphChanges
    .flatMap(pc =>
      pc.sentenceChanges
        .filter(sc => sc.changeType !== 'unchanged')
        .map(sc =>
          `[P${pc.paragraphIndex}S${sc.sentenceIndex}] TYPE=${sc.changeType}\n  OLD: ${sc.oldText ?? '(none)'}\n  NEW: ${sc.newText ?? '(none)'}`
        )
    )
    .join('\n\n');

  const structuralNotes: string[] = [];
  if (diff.structural.paragraphsReordered) {
    structuralNotes.push('STRUCTURAL NOTE: Paragraphs were reordered. Even if text content is unchanged, structural roles may shift.');
  }
  if (diff.structural.paragraphsAdded.length > 0) {
    structuralNotes.push(`STRUCTURAL NOTE: ${diff.structural.paragraphsAdded.length} paragraph(s) added at indices: [${diff.structural.paragraphsAdded.join(', ')}].`);
  }
  if (diff.structural.paragraphsRemoved.length > 0) {
    structuralNotes.push(`STRUCTURAL NOTE: ${diff.structural.paragraphsRemoved.length} paragraph(s) removed from indices: [${diff.structural.paragraphsRemoved.join(', ')}]. Connections referencing these paragraphs are now broken.`);
  }
  if (diff.paragraphChanges.length > 2) {
    structuralNotes.push(`STRUCTURAL NOTE: ${diff.paragraphChanges.length} paragraphs changed — this is a multi-paragraph edit. Significance is at minimum SIGNIFICANT.`);
  }

  const profileContextStr = assembledContext.sections
    .map(s => `### ${s.name}\n${JSON.stringify(s.content, null, 2)}`)
    .join('\n\n');

  const conversationSection = conversationContext
    ? `\n\n## STUDENT'S RECENT MESSAGES (L6 coaching context)\n${conversationContext}\nNote: Use these to infer apparent purpose if relevant, but do not let them bias significance assessment.`
    : '';

  return `## ESSAY EDIT TO ANALYZE

### Changed Portions
${changedPortions || 'Full essay text replaced (see full texts below)'}

${structuralNotes.length > 0 ? structuralNotes.join('\n') : ''}

### Diff Statistics
- Sentences changed: ${diff.stats.totalSentencesChanged}
- Words changed: ${diff.stats.totalWordsChanged}
- Change ratio: ${(diff.stats.changeRatio * 100).toFixed(1)}% of essay

### Full Old Text
${oldText}

### Full New Text
${newText}

---

## EXISTING PROFILE CONTEXT (already analyzed — do not re-derive)

${profileContextStr || 'Profile context not available for this edit (first pass or empty profile).'}
${conversationSection}

---

## REQUIRED OUTPUT FORMAT

Output ONLY this JSON object. Put all reasoning inside the designated fields (significanceReasoning, profileImpact.directImpact, scopeRecommendation.reasoning). No text outside the JSON.

{
  "significance": "minor|moderate|significant|transformative",
  "significanceReasoning": "<specific reasoning citing profile paths>",
  "changeTypes": ["<primary: word_refinement|meaning_evolution|tonal_voice_shift|content_expansion|content_reduction|structural_reorganization", "<secondary if applicable>"],
  "apparentPurpose": "<what the student was likely trying to achieve>",
  "purposeConfidence": 0.0,
  "profileImpact": {
    "directImpact": "<specific sentence/paragraph path that must update>",
    "connectionImpact": [
      {"connectionId": "<id>", "effect": "altered|strengthened|weakened|broken|unchanged", "reasoning": "<why>"}
    ],
    "paragraphImpact": "<paragraph-level role change description>|null",
    "holisticImpact": "<holistic section change description>|null",
    "holisticSections": ["<one or more of: voice_identity, voice_map, emotional_topography, thematic_architecture, narrative_strategy, character_revelation, craft_assessment, admissions_positioning, moment_earnedness_map>"]
  },
  "scopeRecommendation": {
    "scope": "sentence_update|paragraph_reanalysis|targeted_holistic_refresh|comprehensive",
    "reasoning": "<must trace directly from Step 3 mapping>",
    "targets": ["<specific paths: P2S4, voiceMap.shifts, etc>"]
  },
  "unaffectedAreas": ["<area 1 with reasoning>", "<area 2>", "<area 3>"]
}`;
}

// ============================================================================
// STALENESS EFFECT COMPUTATION
// ============================================================================

/**
 * Compute StalenessEffect[] from the Sonnet's understanding output.
 * Maps significance level and profile impact to specific stale targets.
 */
function computeStalenessEffects(
  understanding: SonnetUnderstandingRaw,
  diff: EditDiff
): StalenessEffect[] {
  const effects: StalenessEffect[] = [];

  const sig = understanding.significance;
  const scope = understanding.scopeRecommendation.scope;

  // Direct sentence-level staleness
  for (const pc of diff.paragraphChanges) {
    const changedSentenceIndices = pc.sentenceChanges
      .filter(sc => sc.changeType !== 'unchanged')
      .map(sc => sc.sentenceIndex);

    for (const si of changedSentenceIndices) {
      const strength: StalenessStrength =
        sig === 'transformative' ? 'strong'
        : sig === 'significant' ? 'moderate'
        : 'weak';

      effects.push({
        target: { type: 'sentence', paragraph: pc.paragraphIndex, sentence: si } satisfies StalenessTarget,
        strength,
        reason: `Sentence directly edited (${understanding.changeType}) — significance: ${sig}`,
      });
    }

    // Paragraph-level staleness for modified/added paragraphs
    if (pc.changeType !== 'removed') {
      if (sig === 'transformative' || sig === 'significant') {
        effects.push({
          target: { type: 'paragraph', index: pc.paragraphIndex } satisfies StalenessTarget,
          strength: sig === 'transformative' ? 'strong' : 'moderate',
          reason: `Paragraph role may change due to ${sig} edit`,
        });
      } else if (sig === 'moderate' && understanding.profileImpact.paragraphImpact !== null) {
        effects.push({
          target: { type: 'paragraph', index: pc.paragraphIndex } satisfies StalenessTarget,
          strength: 'weak',
          reason: `Paragraph context shifted: ${understanding.profileImpact.paragraphImpact ?? 'see impact details'}`,
        });
      }
    }
  }

  // North star staleness
  if (sig === 'transformative' || scope === 'comprehensive') {
    effects.push({
      target: { type: 'north_star' } satisfies StalenessTarget,
      strength: 'strong',
      reason: `Transformative edit may require North Star re-crystallization`,
    });
  }

  // Holistic section staleness
  if (understanding.profileImpact.holisticImpact !== null && sig !== 'minor') {
    const holisticStrength: StalenessStrength =
      sig === 'transformative' ? 'strong'
      : sig === 'significant' ? 'moderate'
      : 'weak';

    // Canonical holistic section values (must match HolisticSectionType in profileTypes.ts)
    const VALID_HOLISTIC_SECTIONS: ReadonlySet<string> = new Set<HolisticSectionType>([
      'voice_identity', 'voice_map', 'emotional_topography', 'thematic_architecture',
      'narrative_strategy', 'character_revelation', 'craft_assessment',
      'admissions_positioning', 'moment_earnedness_map', 'cross_dimension_entanglements',
    ]);

    const holisticSections: HolisticSectionType[] = [];

    // Primary: use LLM-supplied holisticSections if present and valid.
    const llmSections = understanding.profileImpact.holisticSections;
    if (Array.isArray(llmSections) && llmSections.length > 0) {
      for (const raw of llmSections) {
        const normalized = typeof raw === 'string' ? raw.toLowerCase().trim() : '';
        if (VALID_HOLISTIC_SECTIONS.has(normalized)) {
          holisticSections.push(normalized as HolisticSectionType);
        }
      }
    }

    // Fallback: keyword matching on the free-text holisticImpact description.
    if (holisticSections.length === 0 && understanding.profileImpact.holisticImpact) {
      const impactText = understanding.profileImpact.holisticImpact.toLowerCase();

      if (impactText.includes('voice')) {
        if (impactText.includes('map')) {
          holisticSections.push('voice_map');
        } else {
          holisticSections.push('voice_identity');
        }
      }
      if (impactText.includes('emotion') || impactText.includes('topograph')) {
        holisticSections.push('emotional_topography');
      }
      if (impactText.includes('thematic') || impactText.includes('architecture') || impactText.includes('thread')) {
        holisticSections.push('thematic_architecture');
      }
      if (impactText.includes('narrative') || impactText.includes('strategy')) {
        holisticSections.push('narrative_strategy');
      }
      if (impactText.includes('character') || impactText.includes('revelation')) {
        holisticSections.push('character_revelation');
      }
      if (impactText.includes('craft')) {
        holisticSections.push('craft_assessment');
      }
      if (impactText.includes('admissions') || impactText.includes('positioning')) {
        holisticSections.push('admissions_positioning');
      }
      if (impactText.includes('earnedness') || impactText.includes('earned')) {
        holisticSections.push('moment_earnedness_map');
      }
    }

    // Last resort: transformative edits with no parsed sections get broad defaults.
    if (holisticSections.length === 0 && sig === 'transformative') {
      holisticSections.push('voice_identity', 'narrative_strategy', 'thematic_architecture', 'character_revelation');
    }

    for (const section of holisticSections) {
      effects.push({
        target: { type: 'holistic', section } satisfies StalenessTarget,
        strength: holisticStrength,
        reason: `Holistic section affected by ${sig} edit: ${understanding.profileImpact.holisticImpact}`,
      });
    }
  }

  // Connection staleness
  for (const ci of understanding.profileImpact.connectionImpact) {
    if (ci.effect !== 'unchanged') {
      effects.push({
        target: { type: 'connections', connectionIds: [ci.connectionId] } satisfies StalenessTarget,
        strength: ci.effect === 'broken' ? 'strong' : 'moderate',
        reason: `Connection ${ci.connectionId} ${ci.effect}: ${ci.reasoning}`,
      });
    }
  }

  // Entanglements staleness for transformative edits
  if (sig === 'transformative') {
    effects.push({
      target: { type: 'entanglements' } satisfies StalenessTarget,
      strength: 'moderate',
      reason: `Transformative edit may alter cross-dimension entanglements`,
    });
  }

  // Paragraph reordering — even unchanged text gets at least moderate paragraph staleness
  if (diff.structural.paragraphsReordered) {
    for (const pc of diff.paragraphChanges) {
      const alreadyHasParagraphEffect = effects.some(
        e => e.target.type === 'paragraph' && (e.target as { type: 'paragraph'; index: number }).index === pc.paragraphIndex
      );
      if (!alreadyHasParagraphEffect) {
        effects.push({
          target: { type: 'paragraph', index: pc.paragraphIndex } satisfies StalenessTarget,
          strength: 'moderate',
          reason: `Paragraph reordered — structural role in essay arc may shift`,
        });
      }
    }
  }

  return effects;
}

// ============================================================================
// ANALYSIS MODE SELECTION
// ============================================================================

/**
 * Select analysis mode based on diff characteristics and significance.
 * This is a heuristic — the Sonnet scope recommendation takes precedence for
 * understanding, but mode determines whether re-analysis is comprehensive or focused.
 *
 * TODO(M1): This function's output is placed on EditUnderstandingOutput.analysisMode,
 * but NO downstream consumer reads that field. The reanalysisOrchestrator uses
 * FocusedAnalyzer.selectAnalysisMode() instead (a separate, more sophisticated
 * implementation that also considers the profile state). This function should be
 * wired into the focused analysis mode selection pipeline so the edit understanding
 * service's heuristic is not ignored. Until then, the field is informational only
 * (logged but not acted upon).
 */
function selectAnalysisMode(
  diff: EditDiff,
  significance: EditUnderstanding['significance']
): 'focused' | 'comprehensive' {
  // Multiple paragraphs changed → comprehensive
  if (diff.paragraphChanges.length > 2) return 'comprehensive';
  // Structural changes (add/remove paragraphs) → comprehensive
  if (diff.structural.paragraphsAdded.length > 0 || diff.structural.paragraphsRemoved.length > 0) return 'comprehensive';
  // Transformative → comprehensive
  if (significance === 'transformative') return 'comprehensive';
  // Everything else → focused
  return 'focused';
}

// ============================================================================
// SPECIAL CASE HANDLERS
// ============================================================================

/**
 * Apply special-case overrides to significance and scope BEFORE sending to Sonnet.
 * These are structural rules that the LLM should not need to re-derive.
 */
function applySpecialCaseOverrides(
  diff: EditDiff,
  minSignificance: EditUnderstanding['significance'] | null
): { forcedMinSignificance: EditUnderstanding['significance'] | null; notes: string[] } {
  let forcedMinSignificance: EditUnderstanding['significance'] | null = minSignificance;
  const notes: string[] = [];

  // Paragraph reordering → at minimum 'moderate'
  if (diff.structural.paragraphsReordered) {
    if (!forcedMinSignificance || ['minor'].includes(forcedMinSignificance)) {
      forcedMinSignificance = 'moderate';
      notes.push('Paragraph reordering detected — minimum significance raised to moderate');
    }
  }

  // Multiple consecutive paragraphs changed → at minimum 'significant'
  if (diff.paragraphChanges.length > 2) {
    if (!forcedMinSignificance || ['minor', 'moderate'].includes(forcedMinSignificance)) {
      forcedMinSignificance = 'significant';
      notes.push(`${diff.paragraphChanges.length} paragraphs changed — minimum significance raised to significant`);
    }
  }

  return { forcedMinSignificance, notes };
}

/**
 * Clamp significance to not be lower than the forced minimum.
 */
function clampSignificance(
  actual: EditUnderstanding['significance'],
  minimum: EditUnderstanding['significance'] | null
): EditUnderstanding['significance'] {
  if (!minimum) return actual;

  const order: EditUnderstanding['significance'][] = ['minor', 'moderate', 'significant', 'transformative'];
  const actualIdx = order.indexOf(actual);
  const minIdx = order.indexOf(minimum);

  return actualIdx >= minIdx ? actual : minimum;
}

// ============================================================================
// TOKEN COST ACCUMULATION HELPERS
// ============================================================================

function makeEmptyTokenUsage(): TokenUsage {
  return { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
}

function addTokenUsage(acc: TokenUsage, r: ClaudeResponse<unknown>): void {
  acc.inputTokens += r.usage.input_tokens;
  acc.outputTokens += r.usage.output_tokens;
  acc.cacheReadTokens += r.usage.cache_read_input_tokens ?? 0;
  acc.cacheWriteTokens += r.usage.cache_creation_input_tokens ?? 0;
}

// ============================================================================
// LLM OUTPUT VALIDATION
// ============================================================================

/** Valid change types accepted from LLM output (canonical EditChangeType values only). */
const VALID_CHANGE_TYPES = new Set<EditChangeType>([
  'word_refinement', 'meaning_evolution', 'tonal_voice_shift',
  'content_expansion', 'content_reduction', 'structural_reorganization',
]);

/**
 * LLM aliases that map to canonical EditChangeType values.
 * Applied before the valid-set check so aliases become proper types rather than falling back.
 */
const CHANGE_TYPE_MAP: Record<string, EditChangeType> = {
  'addition': 'content_expansion',
  'deletion': 'content_reduction',
  'reorder': 'structural_reorganization',
  'tone_shift': 'tonal_voice_shift',
};

/** Valid significance levels accepted from LLM output. */
const VALID_SIGNIFICANCE = new Set(['minor', 'moderate', 'significant', 'transformative']);

/**
 * Sanitize a raw LLM-returned changeType string to a known valid value.
 * LLM aliases (addition, deletion, reorder, tone_shift) are mapped before validation.
 * Falls back to 'meaning_evolution' if unrecognized.
 */
function validateChangeType(raw: unknown): EditChangeType {
  const val = typeof raw === 'string' ? raw.toLowerCase().trim() : '';
  if (CHANGE_TYPE_MAP[val]) return CHANGE_TYPE_MAP[val];
  return (VALID_CHANGE_TYPES.has(val as EditChangeType) ? val : 'meaning_evolution') as EditChangeType;
}

/**
 * Sanitize a raw LLM-returned significance string to a known valid value.
 * 'trivial' is normalized to 'minor' before the valid-set check.
 * Falls back to 'moderate' if unrecognized.
 */
function validateSignificance(raw: unknown): SonnetUnderstandingRaw['significance'] {
  const val = typeof raw === 'string' ? raw.toLowerCase().trim() : '';
  if (val === 'trivial') return 'minor';
  return (VALID_SIGNIFICANCE.has(val) ? val : 'moderate') as SonnetUnderstandingRaw['significance'];
}

// ============================================================================
// JSON PARSING UTILITY (4-LEVEL DEFENSIVE)
// ============================================================================

/**
 * Parse LLM JSON output with four fallback levels.
 * Returns null if all levels fail.
 */
function parseJsonDefensive<T>(raw: string): T | null {
  // Level 1: direct parse
  try {
    return JSON.parse(raw) as T;
  } catch {
    // continue
  }

  // Level 2: strip markdown code blocks + direct parse
  const stripped = raw.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
  try {
    return JSON.parse(stripped) as T;
  } catch {
    // continue
  }

  // Level 3: jsonrepair
  try {
    return JSON.parse(jsonrepair(stripped)) as T;
  } catch {
    // continue
  }

  // Level 4: regex extract the JSON object
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonrepair(jsonMatch[0])) as T;
    } catch {
      // continue
    }
  }

  return null;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class EditUnderstandingService {
  /**
   * Produce nuanced understanding of what an essay edit means in the context
   * of the existing profile.
   *
   * @param oldText - Previous essay text
   * @param newText - New essay text
   * @param profile - Current essay profile (read-only)
   * @param router - Profile router for context assembly
   * @param conversationContext - Optional recent L6 coaching messages for intent inference
   * @returns EditUnderstandingResult with output, cost, and filter metadata
   */
  async understandEdit(
    oldText: string,
    newText: string,
    profile: Readonly<EssayProfile>,
    router: ProfileRouter,
    conversationContext?: string
  ): Promise<EditUnderstandingResult> {
    const startTime = Date.now();

    // Guard: empty newText is an error
    if (!newText || newText.trim().length === 0) {
      throw new Error('[EditUnderstanding] newText is empty — cannot process deletion of entire essay');
    }

    // Handle fresh essay (empty oldText)
    const isFirstPass = !oldText || oldText.trim().length === 0;

    console.log('[EditUnderstanding] Starting edit understanding pipeline');
    console.log(`[EditUnderstanding] Old text: ${oldText.length} chars, New text: ${newText.length} chars`);

    const tokenUsage = makeEmptyTokenUsage();
    let totalCost = 0;

    // -----------------------------------------------------------------------
    // STEP 0: Mechanical Diff
    // -----------------------------------------------------------------------

    const step0Start = Date.now();
    // M2 fix: Pass profile so computeEditDiff can use its pre-split sentence arrays
    // for old paragraphs, ensuring consistent sentence boundaries with the profile.
    const diff = computeEditDiff(isFirstPass ? '' : oldText, newText, isFirstPass ? undefined : profile);
    const step0Ms = Date.now() - step0Start;

    console.log(`[EditUnderstanding] Step 0 diff: ${diff.stats.totalSentencesChanged} sentences changed, ${diff.stats.totalWordsChanged} words changed (${step0Ms}ms)`);

    // Apply special case overrides
    const { forcedMinSignificance, notes: specialCaseNotes } = applySpecialCaseOverrides(diff, null);
    if (specialCaseNotes.length > 0) {
      console.log(`[EditUnderstanding] Special case overrides: ${specialCaseNotes.join('; ')}`);
    }

    // -----------------------------------------------------------------------
    // STEP 1: Haiku Triviality Pre-Filter
    // -----------------------------------------------------------------------

    // Skip filter for first-pass (no old text) — always needs understanding
    let trivialFilterResult: { wasFiltered: boolean; reason?: string } = { wasFiltered: false };

    if (!isFirstPass) {
      const filterStart = Date.now();

      try {
        const filterResult = await runTrivialityFilter(oldText, newText, diff);
        addTokenUsage(tokenUsage, filterResult.rawResponse);
        const filterCost = calculateCost(filterResult.rawResponse.usage, HAIKU);
        totalCost += filterCost;

        const filterMs = Date.now() - filterStart;
        console.log(`[EditUnderstanding] Step 1 filter: ${filterResult.isReal ? 'REAL' : 'TRIVIAL'} (${filterMs}ms, $${filterCost.toFixed(5)})`);
        console.log(`[EditUnderstanding] Filter reason: ${filterResult.reason}`);

        if (!filterResult.isReal) {
          // Early return for trivial edits
          const totalMs = Date.now() - startTime;
          console.log(`[EditUnderstanding] Trivial edit — returning minimal understanding (${totalMs}ms)`);

          const trivialUnderstanding: EditUnderstanding = {
            significance: 'minor',
            significanceReasoning: `Haiku pre-filter classified as TRIVIAL: ${filterResult.reason}`,
            changeType: 'word_refinement',
            apparentPurpose: 'Mechanical correction (spelling, punctuation, or formatting)',
            purposeConfidence: 0.9,
            profileImpact: {
              directImpact: 'No profile update required',
              connectionImpact: [],
              paragraphImpact: null,
              holisticImpact: null,
            },
            scopeRecommendation: {
              scope: 'sentence_update',
              reasoning: 'Trivial mechanical edit — no LLM re-analysis needed',
              targets: [],
            },
          };

          return {
            output: {
              diff,
              understanding: trivialUnderstanding,
              stalenessEffects: [],
              // TODO(M1): analysisMode is currently dead — see selectAnalysisMode() TODO
              analysisMode: 'focused',
            },
            cost: {
              layer: 'edit_understanding',
              cost: totalCost,
              tokenUsage,
              timingMs: totalMs,
            },
            trivialFilter: {
              wasFiltered: true,
              reason: filterResult.reason,
            },
          };
        }
      } catch (filterErr) {
        // Filter failure is non-fatal — proceed to Sonnet
        console.warn('[EditUnderstanding] Triviality filter failed — proceeding to Sonnet:', filterErr);
      }
    } else {
      console.log('[EditUnderstanding] First pass (no old text) — skipping triviality filter');
    }

    // -----------------------------------------------------------------------
    // STEP 2-4: Sonnet Understanding
    // -----------------------------------------------------------------------

    const changedParagraphIndices = diff.paragraphChanges.map(pc => pc.paragraphIndex);

    // Use router to assemble relevant profile context
    // assembleContext requires StalenessSnapshot (counts + entries), but profile.index.stalenessSnapshot
    // stores string[] arrays. Transform to the canonical StalenessSnapshot shape.
    const rawSnapshot = profile.index.stalenessSnapshot;
    const stalenessSnapshot: StalenessSnapshot = {
      strongCount: rawSnapshot?.strongStale?.length ?? 0,
      moderateCount: rawSnapshot?.moderateStale?.length ?? 0,
      weakCount: rawSnapshot?.weakStale?.length ?? 0,
      // strongEntries and moderateEntries require full StalenessEntry objects (target, reason, etc.)
      // The index only stores string keys — provide empty arrays (router uses counts for routing decisions).
      strongEntries: [],
      moderateEntries: [],
    };

    let assembledContext: { sections: Array<{ name: string; content: unknown }>; estimatedTokens: number };

    try {
      const routerResult = router.assembleContext(profile, {
        rule: 'impact_classification',
        editContext: {
          diff,
          changedParagraphs: changedParagraphIndices,
          stalenessSnapshot,
        },
      });
      assembledContext = {
        sections: routerResult.sections.map(s => ({ name: s.name, content: s.content })),
        estimatedTokens: routerResult.estimatedTokens,
      };
      console.log(`[EditUnderstanding] Router assembled ${assembledContext.sections.length} sections (~${assembledContext.estimatedTokens} tokens)`);
    } catch (routerErr) {
      // Router failure is non-fatal — proceed with minimal context
      console.warn('[EditUnderstanding] Router failed — proceeding with minimal context:', routerErr);
      assembledContext = { sections: [], estimatedTokens: 0 };
    }

    const userPrompt = buildUnderstandingUserPrompt(
      isFirstPass ? '' : oldText,
      newText,
      diff,
      assembledContext,
      conversationContext
    );

    const sonnetStart = Date.now();
    let rawSonnetResponse: ClaudeResponse<SonnetUnderstandingRaw>;

    try {
      rawSonnetResponse = await callClaude<SonnetUnderstandingRaw>(userPrompt, {
        model: SONNET,
        systemPrompt: UNDERSTANDING_SYSTEM_PROMPT,
        maxTokens: UNDERSTANDING_MAX_TOKENS,
        temperature: UNDERSTANDING_TEMPERATURE,
        useJsonMode: true,
        cacheSystemPrompt: true,
        timeoutMs: UNDERSTANDING_TIMEOUT_MS,
      });
    } catch (sonnetErr) {
      // Sonnet failure is FATAL — we cannot return fake understanding
      const errMsg = sonnetErr instanceof Error ? sonnetErr.message : String(sonnetErr);
      console.error('[EditUnderstanding] Sonnet understanding call failed:', errMsg);
      throw new Error(`[EditUnderstanding] Sonnet understanding call failed: ${errMsg}`);
    }

    addTokenUsage(tokenUsage, rawSonnetResponse);
    const sonnetCost = calculateCost(rawSonnetResponse.usage, SONNET);
    totalCost += sonnetCost;
    const sonnetMs = Date.now() - sonnetStart;

    console.log(`[EditUnderstanding] Step 2-4 Sonnet: ${sonnetMs}ms, $${sonnetCost.toFixed(5)}`);

    // Parse Sonnet output — with useJsonMode: true, callClaude returns an already-parsed object.
    // Keep parseJsonDefensive as fallback for edge cases where content might still be a string.
    let sonnetParsed: SonnetUnderstandingRaw | null =
      (typeof rawSonnetResponse.content === 'object' && rawSonnetResponse.content !== null)
        ? rawSonnetResponse.content as SonnetUnderstandingRaw
        : null;

    // Fallback: if content came back as a string (edge case), try defensive parsing
    if (!sonnetParsed && typeof rawSonnetResponse.content === 'string') {
      sonnetParsed = parseJsonDefensive<SonnetUnderstandingRaw>(rawSonnetResponse.content);
    }

    // Last resort: Haiku repair — a different model extracting JSON from the raw output
    if (!sonnetParsed) {
      console.warn('[EditUnderstanding] Primary parse failed — attempting Haiku repair');
      try {
        const rawContent = typeof rawSonnetResponse.content === 'string'
          ? rawSonnetResponse.content
          : JSON.stringify(rawSonnetResponse.content);

        const repairResponse = await callClaude<SonnetUnderstandingRaw>({
          model: HAIKU,
          systemPrompt: 'Extract the JSON object from the following text. Output ONLY valid JSON matching the schema described.',
          userPrompt: `Extract the JSON from this LLM output:\n\n${rawContent}\n\nExpected fields: significance, significanceReasoning, changeTypes, apparentPurpose, purposeConfidence, profileImpact, scopeRecommendation, unaffectedAreas`,
          maxTokens: 2048,
          temperature: 0,
          useJsonMode: true,
        });

        if (typeof repairResponse.content === 'object' && repairResponse.content !== null) {
          sonnetParsed = repairResponse.content as SonnetUnderstandingRaw;
          console.log('[EditUnderstanding] Recovered via Haiku repair');
          addTokenUsage(tokenUsage, repairResponse);
          const repairCost = calculateCost(repairResponse.usage, HAIKU);
          totalCost += repairCost;
        }
      } catch (repairErr) {
        console.error('[EditUnderstanding] Haiku repair also failed:', repairErr);
      }
    }

    if (!sonnetParsed) {
      // All parse levels failed — cannot return fake understanding
      const rawContent = typeof rawSonnetResponse.content === 'string'
        ? rawSonnetResponse.content
        : JSON.stringify(rawSonnetResponse.content);
      console.error('[EditUnderstanding] Failed to parse Sonnet response:', String(rawContent).substring(0, 500));
      throw new Error('[EditUnderstanding] All JSON parse attempts failed for Sonnet understanding output');
    }

    // Validate required fields — accept either changeType or changeTypes (array preferred)
    // scopeRecommendation handled separately with safe default (LLM occasionally omits it)
    const requiredFields: string[] = [
      'significance', 'significanceReasoning', 'apparentPurpose',
      'purposeConfidence', 'profileImpact',
    ];
    for (const field of requiredFields) {
      if (!(field in sonnetParsed)) {
        throw new Error(`[EditUnderstanding] Sonnet output missing required field: ${field}`);
      }
    }
    // Safe default for scopeRecommendation — Sonnet occasionally omits this field.
    // Default to paragraph_reanalysis (moderate scope) rather than crashing the edit pipeline.
    if (!('scopeRecommendation' in sonnetParsed) || !sonnetParsed.scopeRecommendation) {
      console.warn('[EditUnderstanding] scopeRecommendation missing from Sonnet output — defaulting to paragraph_reanalysis');
      sonnetParsed.scopeRecommendation = {
        scope: 'paragraph_reanalysis',
        reasoning: 'Field missing from LLM output — defaulting to paragraph-level reanalysis for safety',
        targets: diff.paragraphChanges.map(pc => `P${pc.paragraphIndex + 1}`),
      };
    }
    // changeType OR changeTypes must be present
    if (!('changeType' in sonnetParsed) && !('changeTypes' in sonnetParsed)) {
      throw new Error('[EditUnderstanding] Sonnet output missing both changeType and changeTypes');
    }

    // Validate and sanitize enum fields from LLM output before using them.
    const validatedSignificance = validateSignificance(sonnetParsed.significance);

    // Handle multi-dimensional changeTypes: prefer array form, pick primary for profile interface
    let validatedChangeType: EditChangeType;
    let allChangeTypes: EditChangeType[];

    if (sonnetParsed.changeTypes && Array.isArray(sonnetParsed.changeTypes) && sonnetParsed.changeTypes.length > 0) {
      // Array form (preferred): validate each, pick first as primary
      allChangeTypes = sonnetParsed.changeTypes.map(ct => validateChangeType(ct));
      validatedChangeType = allChangeTypes[0];
      if (allChangeTypes.length > 1) {
        console.log(
          `[EditUnderstanding] Multi-dimensional change types: [${allChangeTypes.join(', ')}] (primary: ${validatedChangeType})`
        );
      }
    } else {
      // Singular form (backward-compatible)
      validatedChangeType = validateChangeType(sonnetParsed.changeType);
      allChangeTypes = [validatedChangeType];
    }

    if (validatedSignificance !== sonnetParsed.significance) {
      console.warn(`[EditUnderstanding] Invalid significance from LLM: "${sonnetParsed.significance}" → defaulting to "${validatedSignificance}"`);
    }

    // Apply special case overrides to significance
    const finalSignificance = clampSignificance(validatedSignificance, forcedMinSignificance);
    if (finalSignificance !== validatedSignificance) {
      console.log(`[EditUnderstanding] Significance clamped: ${validatedSignificance} → ${finalSignificance} (special case rule)`);
    }

    // Build EditUnderstanding object matching profileTypes.ts exactly
    const editUnderstanding: EditUnderstanding = {
      significance: finalSignificance,
      significanceReasoning: sonnetParsed.significanceReasoning,
      changeType: validatedChangeType,
      apparentPurpose: sonnetParsed.apparentPurpose,
      purposeConfidence: Math.max(0, Math.min(1, sonnetParsed.purposeConfidence)),
      profileImpact: {
        directImpact: sonnetParsed.profileImpact.directImpact,
        connectionImpact: (sonnetParsed.profileImpact.connectionImpact ?? []).map(ci => ({
          connectionId: ci.connectionId,
          effect: ci.effect,
          reasoning: ci.reasoning,
        })),
        paragraphImpact: sonnetParsed.profileImpact.paragraphImpact ?? null,
        holisticImpact: sonnetParsed.profileImpact.holisticImpact ?? null,
      },
      scopeRecommendation: {
        scope: sonnetParsed.scopeRecommendation.scope,
        reasoning: sonnetParsed.scopeRecommendation.reasoning,
        targets: sonnetParsed.scopeRecommendation.targets ?? [],
      },
    };

    // Compute staleness effects (use validated fields)
    const stalenessEffects = computeStalenessEffects(
      { ...sonnetParsed, significance: finalSignificance, changeType: validatedChangeType },
      diff
    );

    // Select analysis mode
    const analysisMode = selectAnalysisMode(diff, finalSignificance);

    const totalMs = Date.now() - startTime;
    console.log(
      `[EditUnderstanding] Complete: significance=${finalSignificance}, ` +
      `changeTypes=[${allChangeTypes.join(',')}], ` +
      `scope=${editUnderstanding.scopeRecommendation.scope}, mode=${analysisMode}`
    );
    console.log(`[EditUnderstanding] Total: ${totalMs}ms, $${totalCost.toFixed(5)}, ${stalenessEffects.length} staleness effects`);

    return {
      output: {
        diff,
        understanding: editUnderstanding,
        stalenessEffects,
        // TODO(M1): analysisMode is currently dead — see selectAnalysisMode() TODO
        analysisMode,
      },
      cost: {
        layer: 'edit_understanding',
        cost: totalCost,
        tokenUsage,
        timingMs: totalMs,
      },
      trivialFilter: trivialFilterResult,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const editUnderstandingService = new EditUnderstandingService();
