/**
 * Locator Analyzers & Rubric Bridge
 *
 * Bridges the gap between sophisticated Rubric Analysis (LLM-based) and
 * the Surgical Editor (which needs precise start/end indices).
 *
 * Strategy:
 * 1. Rubric Analyzers identify the "What" (Quote + Issue)
 * 2. Locator Analyzer identifies the "Where" (Start/End Index)
 * 3. Surgical Editor fixes the "How" (Micro-edits)
 */

import {
  MANUFACTURED_PHRASES,
  ABSTRACT_SENSORY_PHRASES,
  FORCED_ARC_PATTERNS
} from '@/core/analysis/features/authenticityDetector';
import { RubricScoringResult, DimensionScoreResult } from '@/core/essay/analysis/features/rubricScorer';
import { WorkshopItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface DetectedLocator {
  quote: string;
  startIndex: number;
  endIndex: number;
  issueType: string;
  severity: 'critical' | 'warning' | 'optimization';
  rubricCategory: string;
  problem: string;
  whyItMatters: string;
}

// ============================================================================
// HELPER: FUZZY MATCHING
// ============================================================================

function findBestMatch(essayText: string, quote: string): { startIndex: number, endIndex: number, matchedText: string } | null {
    // 1. Exact
    let index = essayText.indexOf(quote);
    if (index !== -1) return { startIndex: index, endIndex: index + quote.length, matchedText: quote };

    // 2. Case Insensitive
    const lowerText = essayText.toLowerCase();
    const lowerQuote = quote.toLowerCase();
    index = lowerText.indexOf(lowerQuote);
    if (index !== -1) return { startIndex: index, endIndex: index + quote.length, matchedText: essayText.substring(index, index + quote.length) };

    // 3. Loose Whitespace & Punctuation (Regex)
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Allow any whitespace sequence or punctuation to be flexible? 
    // Just strict whitespace flexibility first:
    const cleanQuote = escapeRegExp(quote).replace(/\s+/g, '\\s+');
    try {
        const regex = new RegExp(cleanQuote, 'i');
        const match = essayText.match(regex);
        if (match && match.index !== undefined) {
             return { startIndex: match.index, endIndex: match.index + match[0].length, matchedText: match[0] };
        }
    } catch (e) {
        // Ignore regex errors
    }

    // 4. Aggressive Fuzzy: Match first 15 chars (Head) and verify roughly
    if (quote.length > 20) {
        const startPart = quote.substring(0, 15);
        const headRegex = new RegExp(escapeRegExp(startPart), 'i');
        const match = essayText.match(headRegex);
        if (match && match.index !== undefined) {
            // Just assume this is the start and take the length of original quote
            // This is risky if the same phrase appears multiple times, but better than nothing.
            // We can refine by checking if the substring roughly matches.
            const candidate = essayText.substring(match.index, match.index + quote.length);
            // Simple Levenshtein-like check? Or just returning it.
            // Let's trust the head match for now if it's unique enough.
            return {
                startIndex: match.index,
                endIndex: Math.min(essayText.length, match.index + quote.length),
                matchedText: candidate
            };
        }
    }

    return null;
}

// ============================================================================
// RUBRIC BRIDGE: Map Rubric Scores to Locators
// ============================================================================

/**
 * Converts a full Rubric Analysis into precise Locators for the Workshop UI.
 * This ensures the Surgical Editor works on the EXACT issues identified by the 13-dimension rubric.
 */
export function mapRubricToLocators(
  rubricResult: RubricScoringResult,
  essayText: string
): DetectedLocator[] {
  const locators: DetectedLocator[] = [];

  rubricResult.dimension_scores.forEach((dim: DimensionScoreResult) => {
    // Only generate locators for dimensions that need improvement (score < 7)
    if (dim.final_score >= 7) return;

    // Determine severity based on score
    let severity: 'critical' | 'warning' | 'optimization' = 'optimization';
    if (dim.final_score < 4) severity = 'critical';
    else if (dim.final_score < 6) severity = 'warning';

    // Map evidence quotes to locations in text
    if (dim.evidence && dim.evidence.quotes) {
      dim.evidence.quotes.forEach(quote => {
        // Clean quote for searching (remove quotes, extra whitespace)
        const cleanQuote = quote.replace(/^["']|["']$/g, '').trim();
        if (cleanQuote.length < 5) return; // Skip too short quotes

        // Find location in text using Fuzzy Match
        const match = findBestMatch(essayText, cleanQuote);

        if (match) {
          locators.push({
            quote: match.matchedText,
            startIndex: match.startIndex,
            endIndex: match.endIndex,
            issueType: 'rubric_gap',
            severity,
            rubricCategory: dim.dimension_name,
            problem: `This section scored ${dim.final_score}/10 in ${dim.dimension_name}.`,
            whyItMatters: dim.evidence.justification || `Improvement needed in ${dim.dimension_name} to reach elite standards.`
          });
        }
      });
    }
  });

  return locators;
}

// ============================================================================
// FALLBACK LOCATORS (Regex-based for fast checks)
// ============================================================================

export function findVoiceIssues(essayText: string): DetectedLocator[] {
  const issues: DetectedLocator[] = [];
  const lowerText = essayText.toLowerCase();

  // 1. Check for Manufactured Phrases
  MANUFACTURED_PHRASES.forEach(phrase => {
    let startIndex = lowerText.indexOf(phrase);
    while (startIndex !== -1) {
      const quote = essayText.substring(startIndex, startIndex + phrase.length);
      issues.push({
        quote,
        startIndex,
        endIndex: startIndex + phrase.length,
        issueType: 'manufactured_phrase',
        severity: 'critical',
        rubricCategory: 'originality_specificity_voice',
        problem: 'This phrase sounds "manufactured" for admissions.',
        whyItMatters: 'Admissions officers see thousands of essays. Stock phrases signal a lack of authentic voice.'
      });
      startIndex = lowerText.indexOf(phrase, startIndex + 1);
    }
  });

  // 2. Check for Forced Arc Patterns (Regex)
  FORCED_ARC_PATTERNS.forEach(pattern => {
     // Ensure global flag for matchAll
    const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
    const globalPattern = new RegExp(pattern.source, flags);

    const matches = essayText.matchAll(globalPattern);
    for (const match of matches) {
      if (match.index !== undefined) {
        issues.push({
          quote: match[0],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          issueType: 'forced_arc',
          severity: 'critical',
          rubricCategory: 'narrative_arc_stakes',
          problem: 'This transition feels forced or formulaic.',
          whyItMatters: 'Organic growth is shown through action, not sudden realizations declared to the reader.'
        });
      }
    }
  });

  return issues;
}

// Simple heuristics for vague claims
const VAGUE_CLAIM_MARKERS = [
  'many things',
  'various activities',
  'worked hard',
  'a lot of effort',
  'countless hours',
  'numerous times',
  'made a difference',
  'positive impact',
  'significant change',
  'various ways',
  'many ways',
  'broadened my horizons',
  'stepped out of my comfort zone'
];

export function findSpecificityIssues(essayText: string): DetectedLocator[] {
  const issues: DetectedLocator[] = [];
  const lowerText = essayText.toLowerCase();

  VAGUE_CLAIM_MARKERS.forEach(marker => {
    let startIndex = lowerText.indexOf(marker);
    while (startIndex !== -1) {
      const quote = essayText.substring(startIndex, startIndex + marker.length);
      issues.push({
        quote,
        startIndex,
        endIndex: startIndex + marker.length,
        issueType: 'vague_claim',
        severity: 'warning',
        rubricCategory: 'specificity_evidence',
        problem: 'This claim lacks specific evidence or quantification.',
        whyItMatters: 'Vague claims are forgettable. Specifics (numbers, names, details) stick in the reader\'s mind.'
      });
      startIndex = lowerText.indexOf(marker, startIndex + 1);
    }
  });

  return issues;
}

// Abstract nouns often used in "telling"
const ABSTRACT_TELLING_WORDS = [
  'ambition', 'dedication', 'passion', 'success', 'leadership', 
  'responsibility', 'teamwork', 'communication', 'perseverance'
];

export function findShowDontTellIssues(essayText: string): DetectedLocator[] {
  const issues: DetectedLocator[] = [];
  const lowerText = essayText.toLowerCase();

  // Check for abstract sensory phrases
  ABSTRACT_SENSORY_PHRASES.forEach(phrase => {
    let startIndex = lowerText.indexOf(phrase);
    while (startIndex !== -1) {
      const quote = essayText.substring(startIndex, startIndex + phrase.length);
      issues.push({
        quote,
        startIndex,
        endIndex: startIndex + phrase.length,
        issueType: 'forced_sensory',
        severity: 'warning',
        rubricCategory: 'show_dont_tell_craft',
        problem: 'This sensory detail feels abstract or forced.',
        whyItMatters: 'True sensory details are concrete (smell of rain) not abstract (smell of ambition).'
      });
      startIndex = lowerText.indexOf(phrase, startIndex + 1);
    }
  });

  // Check for "I felt [ABSTRACT NOUN]" pattern (simple heuristic)
  ABSTRACT_TELLING_WORDS.forEach(word => {
    const patterns = [
      `i felt ${word}`,
      `filled with ${word}`,
      `sense of ${word}`
    ];

    patterns.forEach(pattern => {
      let startIndex = lowerText.indexOf(pattern);
      while (startIndex !== -1) {
        const quote = essayText.substring(startIndex, startIndex + pattern.length);
        issues.push({
          quote,
          startIndex,
          endIndex: startIndex + pattern.length,
          issueType: 'abstract_telling',
          severity: 'optimization',
          rubricCategory: 'show_dont_tell_craft',
          problem: `This tells the reader about "${word}" instead of showing it.`,
          whyItMatters: 'Don\'t say you had dedication; describe the 4am wake-up calls.'
        });
        startIndex = lowerText.indexOf(pattern, startIndex + 1);
      }
    });
  });

  return issues;
}

// ============================================================================
// MASTER AGGREGATOR
// ============================================================================

/**
 * Combines Rubric-derived locators (primary) with Regex-derived locators (backup/fast).
 */
export function findAllLocators(
  essayText: string, 
  rubricResult?: RubricScoringResult
): DetectedLocator[] {
  let locators: DetectedLocator[] = [];

  // 1. Prefer Rubric Locators (High precision, tied to analysis)
  if (rubricResult) {
    locators = mapRubricToLocators(rubricResult, essayText);
  }

  // 2. Add Regex Locators (Fast check for specific patterns)
  // Only add if not already covered? For now, we add them as supplementary.
  // We can filter duplicates later.
  const regexLocators = [
    ...findVoiceIssues(essayText),
    ...findSpecificityIssues(essayText),
    ...findShowDontTellIssues(essayText)
  ];

  // Merge logic: Don't add regex locator if it overlaps significantly with a rubric locator
  // This avoids double-flagging the same sentence.
  regexLocators.forEach(regexLoc => {
    const isDuplicate = locators.some(rubricLoc => 
      Math.abs(rubricLoc.startIndex - regexLoc.startIndex) < 10 // Starts within 10 chars
    );
    
    if (!isDuplicate) {
      locators.push(regexLoc);
    }
  });

  return locators;
}
