/**
 * Structure Analyzer — Essay Structure Decomposition (Phase 2A)
 *
 * Runs BEFORE the LLM annotation call to provide structural context that helps
 * the Sonnet model write better annotations. Every heuristic here only COUNTS
 * exact matches, computes statistical measures, or detects presence/absence of
 * literal patterns. No judgment heuristics — if determining a value requires
 * understanding context, intent, or meaning, it belongs in the LLM call.
 *
 * Builds on existing workshop analyzers:
 *   - narrativeAnalyzers.ts  → arc detection
 *   - paragraphFunctionClassifier.ts → per-paragraph function classification
 *   - structuralPatternDetector.ts → per-paragraph metrics & cross-paragraph shifts
 *   - featureExtractor.ts → splitParagraphs, splitWords, splitSentences, word lists
 */

import type {
  ArcType,
  EssayBeat,
  BeatAnnotation,
  PacingAnalysis,
  EssayStructureAnalysis,
} from './contentAnalysisTypes';

import { analyzeNarrativeArc } from '../workshop/scoring/narrativeAnalyzers';
import { classifyParagraphFunctions } from '../workshop/scoring/paragraphFunctionClassifier';
import {
  analyzeStructuralPatterns,
  getContentWords,
  isAbstractNoun,
} from '../workshop/scoring/structuralPatternDetector';
import {
  splitParagraphs,
  splitWords,
  splitSentences,
  REFLECTION_MARKERS,
} from '../workshop/scoring/featureExtractor';

import type { ParagraphFunction } from '../workshop/scoring/narrativeAnalyzerTypes';
import type { CrossParagraphShifts, ParagraphMetrics } from '../workshop/scoring/structuralPatternDetector';

// ============================================================================
// TEMPORAL MARKER SET (for montage detection)
// ============================================================================

const TEMPORAL_MARKERS = new Set([
  'then', 'next', 'after', 'before', 'later', 'earlier', 'finally',
  'meanwhile', 'suddenly', 'soon', 'eventually', 'subsequently',
  'first', 'second', 'third', 'last', 'yesterday', 'tomorrow',
  'morning', 'evening', 'night', 'year', 'month', 'week', 'day',
  'when', 'while', 'during', 'until', 'since',
]);

// ============================================================================
// ARC DETECTION HELPERS
// ============================================================================

/**
 * Detect circular arc: first and last paragraph share 2+ content words.
 * Pure word-overlap counting — no semantic judgment.
 */
function detectCircularSignal(paragraphs: string[]): boolean {
  if (paragraphs.length < 3) return false;
  const firstWords = getContentWords(splitWords(paragraphs[0]));
  const lastWords = getContentWords(splitWords(paragraphs[paragraphs.length - 1]));
  // Require 3+ shared content words — filters out coincidental overlap
  // from common words like "community", "life", etc.
  let overlap = 0;
  for (const w of firstWords) {
    if (lastWords.has(w)) overlap++;
  }
  return overlap >= 3;
}

/**
 * Detect in_medias_res: first paragraph has high past-tense ratio (>0.5),
 * high proper noun density (>0.02), and sentence length variance > 0.4.
 * All thresholds are statistical — no interpretation.
 */
function detectInMediasResSignal(firstParagraphMetrics: ParagraphMetrics): boolean {
  return (
    firstParagraphMetrics.pastTenseRatio > 0.5 &&
    firstParagraphMetrics.properNounDensity > 0.02 &&
    firstParagraphMetrics.sentenceLengthCV > 0.4
  );
}

/**
 * Detect montage: high vocabulary shift between most adjacent paragraphs
 * (avg Jaccard distance > 0.85) AND low temporal marker count.
 */
function detectMontageSignal(
  shifts: CrossParagraphShifts[],
  paragraphs: string[],
): boolean {
  if (shifts.length === 0) return false;
  const avgVocabShift = shifts.reduce((s, sh) => s + sh.vocabularyShift, 0) / shifts.length;

  // Count temporal markers across the entire essay
  const allWords = splitWords(paragraphs.join(' '));
  const temporalCount = allWords.filter(w => TEMPORAL_MARKERS.has(w)).length;
  const temporalDensity = allWords.length > 0 ? temporalCount / allWords.length : 0;

  return avgVocabShift > 0.85 && temporalDensity < 0.02;
}

/**
 * Detect zoom_lens: sentence length mean is monotonically increasing or
 * decreasing across paragraphs (>60% monotonic transitions).
 */
function detectZoomLensSignal(paragraphMetrics: ParagraphMetrics[]): boolean {
  if (paragraphMetrics.length < 3) return false;

  let increasing = 0;
  let decreasing = 0;
  const transitions = paragraphMetrics.length - 1;

  for (let i = 1; i < paragraphMetrics.length; i++) {
    if (paragraphMetrics[i].sentenceLengthMean > paragraphMetrics[i - 1].sentenceLengthMean) {
      increasing++;
    } else if (paragraphMetrics[i].sentenceLengthMean < paragraphMetrics[i - 1].sentenceLengthMean) {
      decreasing++;
    }
  }

  const maxDirectional = Math.max(increasing, decreasing);
  return maxDirectional / transitions > 0.6;
}

/**
 * Detect braided: alternating tense shifts (past <-> present) in 3+ transitions.
 * Counts exact tense-ratio direction changes — no interpretation.
 */
function detectBraidedSignal(shifts: CrossParagraphShifts[], paragraphMetrics: ParagraphMetrics[]): boolean {
  if (paragraphMetrics.length < 4) return false;

  let alternations = 0;
  for (let i = 1; i < paragraphMetrics.length; i++) {
    const prevPast = paragraphMetrics[i - 1].pastTenseRatio;
    const currPast = paragraphMetrics[i].pastTenseRatio;
    // Detect a meaningful shift (> 0.15 change in past-tense ratio)
    if (Math.abs(currPast - prevPast) > 0.15) {
      // Check if this shift reverses the previous one
      if (i >= 2) {
        const prevPrevPast = paragraphMetrics[i - 2].pastTenseRatio;
        const prevDirection = prevPast - prevPrevPast;
        const currDirection = currPast - prevPast;
        if (prevDirection * currDirection < 0) {
          // Directions are opposite — this is an alternation
          alternations++;
        }
      }
    }
  }

  return alternations >= 3;
}

// ============================================================================
// BEAT MAPPING
// ============================================================================

/** Core beats that a well-structured essay should contain */
const CORE_BEATS: EssayBeat[] = ['hook', 'rising', 'pivot', 'reflection', 'resolution'];

/** Setup-category beats (front of essay) */
const SETUP_BEATS: Set<EssayBeat> = new Set(['hook', 'setup', 'inciting']);

/** Payoff-category beats (back of essay) */
const PAYOFF_BEATS: Set<EssayBeat> = new Set([
  'reflection', 'resolution', 'connection', 'callback', 'coda',
]);

/**
 * Map a paragraph function + positional context to an essay beat.
 * Returns null for ambiguous functions (deferred to LLM).
 */
function mapFunctionToBeat(
  func: ParagraphFunction,
  index: number,
  totalParagraphs: number,
  pivotSeen: boolean,
): EssayBeat | null {
  switch (func) {
    case 'grounding':
      return index === 0 ? 'hook' : 'setup';
    case 'escalation':
      return 'rising';
    case 'contrast':
      return 'pivot';
    case 'intimacy':
      return pivotSeen ? 'reflection' : 'rising';
    case 'reflection':
      return 'reflection';
    case 'release':
      return 'resolution';
    case 'characterization': {
      // Early = setup, middle/late = rising
      const earlyThreshold = totalParagraphs > 2 ? Math.ceil(totalParagraphs * 0.3) : 1;
      return index < earlyThreshold ? 'setup' : 'rising';
    }
    case 'ambiguous':
    case 'transition':
    case 'exposition':
      return null;
    default:
      return null;
  }
}

/**
 * Detect callback beat: last 2 paragraphs share 2+ content words
 * with first 2 paragraphs. Pure word-overlap counting.
 */
function detectCallbackBeat(paragraphs: string[]): boolean {
  if (paragraphs.length < 4) return false;

  const firstTwo = paragraphs.slice(0, 2).join(' ');
  const lastTwo = paragraphs.slice(-2).join(' ');
  const firstWords = getContentWords(splitWords(firstTwo));
  const lastWords = getContentWords(splitWords(lastTwo));

  let overlap = 0;
  for (const w of lastWords) {
    if (firstWords.has(w)) overlap++;
  }
  return overlap >= 2;
}

/**
 * Detect connection beat: last paragraph has high abstract noun ratio (>0.04)
 * AND contains reflection markers. Pure counting.
 */
function detectConnectionBeat(lastParagraph: string): boolean {
  const words = splitWords(lastParagraph);
  if (words.length === 0) return false;

  let abstractCount = 0;
  for (const w of words) {
    if (isAbstractNoun(w)) abstractCount++;
  }
  const abstractRatio = abstractCount / words.length;

  const lowerText = lastParagraph.toLowerCase();
  let hasReflectionMarker = false;
  for (const marker of REFLECTION_MARKERS) {
    if (lowerText.includes(marker)) {
      hasReflectionMarker = true;
      break;
    }
  }

  return abstractRatio > 0.04 && hasReflectionMarker;
}

/**
 * Detect coda beat: final paragraph is short (<30 words) AND follows
 * a resolution or connection paragraph. Pure word-count check.
 */
function detectCodaBeat(
  paragraphs: string[],
  beats: BeatAnnotation[],
): boolean {
  if (paragraphs.length < 2) return false;

  const lastWords = splitWords(paragraphs[paragraphs.length - 1]);
  if (lastWords.length >= 30) return false;

  // Check if preceding paragraph was classified as resolution or connection
  const precedingBeat = beats.find(b =>
    b.paragraphIndices.includes(paragraphs.length - 2),
  );
  return precedingBeat !== undefined &&
    (precedingBeat.beatType === 'resolution' || precedingBeat.beatType === 'connection');
}

// ============================================================================
// MAIN ANALYSIS
// ============================================================================

/**
 * Analyze essay structure: arc detection, beat mapping, pacing analysis,
 * and structural diagnostics. All heuristics count or measure — no judgment.
 */
export function analyzeEssayStructure(text: string): EssayStructureAnalysis {
  const paragraphs = splitParagraphs(text);

  // Handle empty or single-paragraph essays
  if (paragraphs.length === 0) {
    return emptyResult();
  }

  if (paragraphs.length === 1) {
    return singleParagraphResult(paragraphs[0]);
  }

  // --- Gather building-block analyses ---
  const narrativeArc = analyzeNarrativeArc(text);
  const paragraphFunctions = classifyParagraphFunctions(text);
  const structural = analyzeStructuralPatterns(text);

  // --- Arc Detection ---
  const detectedArc = resolveArcType(
    narrativeArc.detectedArc,
    narrativeArc.confidence,
    paragraphs,
    structural.paragraphs,
    structural.shifts,
  );

  // --- Beat Mapping ---
  const beats = mapBeats(paragraphs, paragraphFunctions, structural.paragraphs);

  // --- Pacing Analysis ---
  const pacing = analyzePacing(beats, paragraphs.length);

  // --- Diagnostics ---
  const diagnostics = buildDiagnostics(beats, pacing, paragraphs.length);

  return {
    detectedArc: detectedArc.arc,
    arcConfidence: detectedArc.confidence,
    beats,
    pacing,
    diagnostics,
  };
}

// ============================================================================
// ARC RESOLUTION
// ============================================================================

interface ArcResult {
  arc: ArcType;
  confidence: number;
}

/**
 * Resolve arc type by checking essay-specific signals first, then falling back
 * to the narrative analyzer's arc (mapped to our ArcType).
 * The essay-specific arc with the highest signal count wins.
 */
function resolveArcType(
  narrativeArcType: string,
  narrativeArcConfidence: number,
  paragraphs: string[],
  paragraphMetrics: ParagraphMetrics[],
  shifts: CrossParagraphShifts[],
): ArcResult {
  // Count essay-specific arc signals
  const signals: Array<{ arc: ArcType; detected: boolean }> = [
    { arc: 'circular', detected: detectCircularSignal(paragraphs) },
    { arc: 'in_medias_res', detected: paragraphMetrics.length > 0 && detectInMediasResSignal(paragraphMetrics[0]) },
    { arc: 'montage', detected: detectMontageSignal(shifts, paragraphs) },
    { arc: 'zoom_lens', detected: detectZoomLensSignal(paragraphMetrics) },
    { arc: 'braided', detected: detectBraidedSignal(shifts, paragraphMetrics) },
  ];

  const detected = signals.filter(s => s.detected);

  // If any essay-specific arc is detected, use the first one found
  // (they are ordered by specificity — circular is most distinctive)
  if (detected.length > 0) {
    return { arc: detected[0].arc, confidence: 0.6 };
  }

  // Fall back to narrativeAnalyzer's arc, mapped to our ArcType
  const mapped = mapNarrativeArcToArcType(narrativeArcType);
  return {
    arc: mapped,
    confidence: mapped === 'ambiguous' ? narrativeArcConfidence : Math.max(narrativeArcConfidence, 0.4),
  };
}

/**
 * Map NarrativeArcType values to our ArcType.
 * All classic narrative arcs map to 'linear' since they are chronological variants.
 */
function mapNarrativeArcToArcType(arcType: string): ArcType {
  switch (arcType) {
    case 'man_in_hole':
    case 'cinderella':
    case 'icarus':
    case 'quest':
    case 'rags_to_riches':
      return 'linear';
    case 'ambiguous':
      return 'ambiguous';
    default:
      return 'ambiguous';
  }
}

// ============================================================================
// BEAT MAPPING ORCHESTRATION
// ============================================================================

function mapBeats(
  paragraphs: string[],
  paragraphFunctions: Array<{ index: number; detectedFunction: ParagraphFunction; confidence: number }>,
  paragraphMetrics: ParagraphMetrics[],
): BeatAnnotation[] {
  const beats: BeatAnnotation[] = [];
  let pivotSeen = false;

  // Phase 1: Map paragraph functions to beats
  for (const pf of paragraphFunctions) {
    const beat = mapFunctionToBeat(
      pf.detectedFunction,
      pf.index,
      paragraphs.length,
      pivotSeen,
    );

    if (beat === null) continue; // ambiguous — skip, LLM will handle

    if (beat === 'pivot') pivotSeen = true;

    const evidence = paragraphs[pf.index].slice(0, 100);
    beats.push({
      beatType: beat,
      paragraphIndices: [pf.index],
      evidence,
      confidence: pf.confidence,
    });
  }

  // Phase 2: Detect special beats (callback, connection, coda)
  if (detectCallbackBeat(paragraphs)) {
    const lastIdx = paragraphs.length - 1;
    // Only add if the last paragraph isn't already annotated with a more specific beat
    const existingLast = beats.find(b => b.paragraphIndices.includes(lastIdx));
    if (!existingLast || existingLast.beatType === 'rising' || existingLast.beatType === 'setup') {
      // Remove existing beat for last paragraph if it was generic
      const filtered = beats.filter(b => !b.paragraphIndices.includes(lastIdx));
      filtered.push({
        beatType: 'callback',
        paragraphIndices: [lastIdx],
        evidence: paragraphs[lastIdx].slice(0, 100),
        confidence: 0.5,
      });
      beats.length = 0;
      beats.push(...filtered);
    }
  }

  if (detectConnectionBeat(paragraphs[paragraphs.length - 1])) {
    const lastIdx = paragraphs.length - 1;
    const existingLast = beats.find(b => b.paragraphIndices.includes(lastIdx));
    // Connection takes precedence over generic beats but not callback
    if (!existingLast || (existingLast.beatType !== 'callback' && existingLast.beatType !== 'resolution')) {
      const filtered = beats.filter(b => !b.paragraphIndices.includes(lastIdx));
      filtered.push({
        beatType: 'connection',
        paragraphIndices: [lastIdx],
        evidence: paragraphs[lastIdx].slice(0, 100),
        confidence: 0.5,
      });
      beats.length = 0;
      beats.push(...filtered);
    }
  }

  if (detectCodaBeat(paragraphs, beats)) {
    const lastIdx = paragraphs.length - 1;
    const filtered = beats.filter(b => !b.paragraphIndices.includes(lastIdx));
    filtered.push({
      beatType: 'coda',
      paragraphIndices: [lastIdx],
      evidence: paragraphs[lastIdx].slice(0, 100),
      confidence: 0.5,
    });
    beats.length = 0;
    beats.push(...filtered);
  }

  // Sort beats by paragraph index for consistent ordering
  beats.sort((a, b) => a.paragraphIndices[0] - b.paragraphIndices[0]);

  return beats;
}

// ============================================================================
// PACING ANALYSIS
// ============================================================================

function analyzePacing(beats: BeatAnnotation[], totalParagraphs: number): PacingAnalysis {
  if (totalParagraphs === 0) {
    return { balance: 'balanced', setupRatio: 0, payoffRatio: 0, reflectionPresent: false };
  }

  let setupCount = 0;
  let payoffCount = 0;
  let reflectionPresent = false;

  for (const beat of beats) {
    const count = beat.paragraphIndices.length;
    if (SETUP_BEATS.has(beat.beatType)) {
      setupCount += count;
    }
    if (PAYOFF_BEATS.has(beat.beatType)) {
      payoffCount += count;
    }
    if (beat.beatType === 'reflection' || beat.beatType === 'connection') {
      reflectionPresent = true;
    }
  }

  const setupRatio = setupCount / totalParagraphs;
  const payoffRatio = payoffCount / totalParagraphs;

  let balance: PacingAnalysis['balance'];
  if (setupRatio > 0.5) {
    balance = 'front_loaded';
  } else if (payoffRatio > 0.5) {
    balance = 'back_loaded';
  } else {
    balance = 'balanced';
  }

  return {
    balance,
    setupRatio: Math.round(setupRatio * 100) / 100,
    payoffRatio: Math.round(payoffRatio * 100) / 100,
    reflectionPresent,
  };
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

function buildDiagnostics(
  beats: BeatAnnotation[],
  pacing: PacingAnalysis,
  totalParagraphs: number,
): EssayStructureAnalysis['diagnostics'] {
  const presentBeatTypes = new Set(beats.map(b => b.beatType));
  const missingBeats = CORE_BEATS.filter(b => !presentBeatTypes.has(b));

  const observations: string[] = [];

  // Missing beat observations
  for (const missing of missingBeats) {
    observations.push(`No ${missing} beat detected`);
  }

  // Pacing observations
  if (pacing.balance === 'front_loaded') {
    const pct = Math.round(pacing.setupRatio * 100);
    observations.push(`Essay is front-loaded (${pct}% setup)`);
  } else if (pacing.balance === 'back_loaded') {
    const pct = Math.round(pacing.payoffRatio * 100);
    observations.push(`Essay is back-loaded (${pct}% payoff)`);
  }

  if (!pacing.reflectionPresent) {
    observations.push('No reflection or connection passage detected');
  }

  // Beat diversity observation
  if (presentBeatTypes.size <= 2 && totalParagraphs >= 4) {
    observations.push(
      `Low beat diversity: only ${presentBeatTypes.size} beat type(s) across ${totalParagraphs} paragraphs`,
    );
  }

  return { missingBeats, observations };
}

// ============================================================================
// EDGE CASE RESULTS
// ============================================================================

function emptyResult(): EssayStructureAnalysis {
  return {
    detectedArc: 'ambiguous',
    arcConfidence: 0,
    beats: [],
    pacing: {
      balance: 'balanced',
      setupRatio: 0,
      payoffRatio: 0,
      reflectionPresent: false,
    },
    diagnostics: {
      missingBeats: [...CORE_BEATS],
      observations: ['Empty essay — no structure to analyze'],
    },
  };
}

function singleParagraphResult(paragraph: string): EssayStructureAnalysis {
  const evidence = paragraph.slice(0, 100);
  return {
    detectedArc: 'ambiguous',
    arcConfidence: 0,
    beats: [
      {
        beatType: 'hook',
        paragraphIndices: [0],
        evidence,
        confidence: 0.3,
      },
    ],
    pacing: {
      balance: 'balanced',
      setupRatio: 1,
      payoffRatio: 0,
      reflectionPresent: false,
    },
    diagnostics: {
      missingBeats: ['rising', 'pivot', 'reflection', 'resolution'],
      observations: ['Single paragraph — structure analysis limited'],
    },
  };
}

// ============================================================================
// CLASS + SINGLETON EXPORTS
// ============================================================================

export class StructureAnalyzer {
  /**
   * Analyze essay structure: arc detection, beat mapping, pacing, and diagnostics.
   * All heuristics count or measure — judgment belongs in the LLM call.
   */
  analyze(text: string): EssayStructureAnalysis {
    return analyzeEssayStructure(text);
  }
}

export const structureAnalyzer = new StructureAnalyzer();
