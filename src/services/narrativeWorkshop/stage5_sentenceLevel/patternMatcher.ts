// @ts-nocheck
/**
 * Stage 5.1: Pattern Matcher
 *
 * Maps detected issues from Stages 1-4 to specific sentences in the essay.
 * Creates sentence-level precision for actionable feedback.
 *
 * Approach:
 * 1. Parse essay into sentences with indices
 * 2. Match detected issues to specific sentences
 * 3. Extract surrounding context (before/after sentences)
 * 4. Categorize by severity and dimension
 * 5. Prioritize by impact (severity × dimension weight)
 *
 * This enables hyper-specific feedback like:
 * "Sentence 15: 'I worked hard' → Replace with specific action"
 */

import {
  HolisticUnderstanding,
  DeepDiveAnalyses,
  GrammarStyleAnalysis,
  SynthesizedInsights,
  SentenceLevelInsight
} from '../types';
import { ALL_NARRATIVE_PATTERNS } from '../narrativePatterns';

export interface ParsedSentence {
  index: number;
  text: string;
  paragraphIndex: number;
  section: 'opening' | 'body' | 'climax' | 'conclusion';
  wordCount: number;
}

/**
 * Parse essay into sentences with metadata
 */
export function parseEssayIntoSentences(essayText: string): ParsedSentence[] {
  const paragraphs = essayText.split(/\n\n+/);
  const sentences: ParsedSentence[] = [];

  let globalSentenceIndex = 0;
  let totalSentences = 0;

  // First pass: count total sentences
  paragraphs.forEach(para => {
    const paraSentences = para.split(/[.!?]+/).filter(s => s.trim().length > 0);
    totalSentences += paraSentences.length;
  });

  paragraphs.forEach((paragraph, paraIndex) => {
    const paraSentences = paragraph
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    paraSentences.forEach((sentence) => {
      const wordCount = sentence.split(/\s+/).length;

      // Determine section
      let section: 'opening' | 'body' | 'climax' | 'conclusion';
      const progress = globalSentenceIndex / totalSentences;

      if (progress < 0.15) section = 'opening';
      else if (progress > 0.80) section = 'conclusion';
      else if (progress >= 0.40 && progress <= 0.70) section = 'climax';
      else section = 'body';

      sentences.push({
        index: globalSentenceIndex,
        text: sentence,
        paragraphIndex: paraIndex,
        section,
        wordCount
      });

      globalSentenceIndex++;
    });
  });

  return sentences;
}

/**
 * Match detected issues to specific sentences
 */
export function matchIssuesToSentences(
  sentences: ParsedSentence[],
  stage2: DeepDiveAnalyses,
  stage3: GrammarStyleAnalysis,
  synthesis: SynthesizedInsights
): Array<{
  sentence: ParsedSentence;
  issueType: string;
  issueCategory: string;
  severity: 'critical' | 'major' | 'minor';
  evidence: string;
  patternId?: string;
}> {
  const matches: Array<{
    sentence: ParsedSentence;
    issueType: string;
    issueCategory: string;
    severity: 'critical' | 'major' | 'minor';
    evidence: string;
    patternId?: string;
  }> = [];

  // Match issues from Stage 2 body development
  stage2.bodyDevelopment.detectedIssues.forEach(issue => {
    const matchedSentence = findSentenceContaining(sentences, issue.quote);
    if (matchedSentence) {
      matches.push({
        sentence: matchedSentence,
        issueType: issue.type,
        issueCategory: 'show_dont_tell_concrete',
        severity: issue.severity,
        evidence: issue.explanation
      });
    }
  });

  // Match vague statements
  stage2.bodyDevelopment.vagueStatements.forEach(vague => {
    const matchedSentence = findSentenceContaining(sentences, vague);
    if (matchedSentence) {
      matches.push({
        sentence: matchedSentence,
        issueType: 'vague_language',
        issueCategory: 'originality_specificity_voice',
        severity: 'major',
        evidence: vague
      });
    }
  });

  // Match clichés from conclusion
  stage2.conclusionReflection.clichesDetected.forEach(cliche => {
    const matchedSentence = findSentenceContaining(sentences, cliche);
    if (matchedSentence) {
      matches.push({
        sentence: matchedSentence,
        issueType: 'cliche',
        issueCategory: 'reflection_meaning_making',
        severity: 'critical',
        evidence: cliche
      });
    }
  });

  // Match generic statements
  stage2.conclusionReflection.genericStatements.forEach(generic => {
    const matchedSentence = findSentenceContaining(sentences, generic);
    if (matchedSentence) {
      matches.push({
        sentence: matchedSentence,
        issueType: 'generic_reflection',
        issueCategory: 'reflection_meaning_making',
        severity: 'major',
        evidence: generic
      });
    }
  });

  // Match grammar red flags
  stage3.grammarAnalysis.redFlags.forEach(flag => {
    // Extract quote if present
    const quoteMatch = flag.match(/"([^"]+)"/);
    if (quoteMatch) {
      const matchedSentence = findSentenceContaining(sentences, quoteMatch[1]);
      if (matchedSentence) {
        matches.push({
          sentence: matchedSentence,
          issueType: 'grammar_issue',
          issueCategory: 'sentence_craft_style',
          severity: flag.includes('CRITICAL') ? 'critical' : 'major',
          evidence: flag
        });
      }
    }
  });

  // Match weak verbs
  stage3.grammarAnalysis.verbAnalysis.weakVerbs.slice(0, 3).forEach(verb => {
    const matchedSentence = findSentenceWithWord(sentences, verb);
    if (matchedSentence) {
      matches.push({
        sentence: matchedSentence,
        issueType: 'weak_verb',
        issueCategory: 'sentence_craft_style',
        severity: 'minor',
        evidence: `Weak verb: "${verb}"`
      });
    }
  });

  // Match pattern-based issues from narrative patterns
  sentences.forEach(sentence => {
    ALL_NARRATIVE_PATTERNS.forEach(pattern => {
      if (pattern.detectionRegex && pattern.detectionRegex.test(sentence.text)) {
        matches.push({
          sentence,
          issueType: pattern.patternId,
          issueCategory: pattern.category,
          severity: pattern.severity,
          evidence: sentence.text,
          patternId: pattern.patternId
        });
      }
    });
  });

  return matches;
}

/**
 * Find sentence containing specific text
 */
function findSentenceContaining(
  sentences: ParsedSentence[],
  text: string
): ParsedSentence | null {
  const searchText = text.toLowerCase().trim();
  return sentences.find(s => s.text.toLowerCase().includes(searchText)) || null;
}

/**
 * Find sentence containing specific word
 */
function findSentenceWithWord(
  sentences: ParsedSentence[],
  word: string
): ParsedSentence | null {
  const searchWord = word.toLowerCase().trim();
  return sentences.find(s => {
    const words = s.text.toLowerCase().split(/\s+/);
    return words.includes(searchWord);
  }) || null;
}

/**
 * Get surrounding context for a sentence
 */
export function getSurroundingContext(
  sentences: ParsedSentence[],
  sentenceIndex: number
): {
  beforeSentence: string | null;
  afterSentence: string | null;
} {
  const before = sentenceIndex > 0 ? sentences[sentenceIndex - 1].text : null;
  const after = sentenceIndex < sentences.length - 1 ? sentences[sentenceIndex + 1].text : null;

  return { beforeSentence: before, afterSentence: after };
}

/**
 * Prioritize insights by impact
 */
export function prioritizeInsights(
  insights: SentenceLevelInsight[],
  dimensionScores: Record<string, number>
): SentenceLevelInsight[] {
  // Calculate priority score for each insight
  const scored = insights.map(insight => {
    let score = 0;

    // Severity weight (40%)
    if (insight.severity === 'critical') score += 40;
    else if (insight.severity === 'major') score += 25;
    else score += 10;

    // Dimension score weight (30% - lower dimension score = higher priority to fix)
    const dimScore = dimensionScores[insight.issueCategory] || 5;
    score += (10 - dimScore) * 3;

    // Section weight (20% - opening and conclusion more important)
    if (insight.essaySection === 'opening') score += 20;
    else if (insight.essaySection === 'conclusion') score += 15;
    else if (insight.essaySection === 'climax') score += 12;
    else score += 8;

    // Estimated impact weight (10%)
    const impactMatch = insight.impactOnScore.match(/[-+](\d+)/);
    if (impactMatch) {
      score += parseInt(impactMatch[1]);
    }

    return { insight, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => s.insight);
}
