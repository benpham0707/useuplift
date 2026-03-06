/**
 * Character Revelation Analyzer — Phase 2C
 *
 * Detects character revelation patterns in essay text using a 7-level hierarchy.
 * All analysis is heuristic (counting, pattern matching, presence detection).
 * Outputs are CONTEXT for the LLM, not verdicts.
 *
 * Building blocks reused:
 * - featureExtractor: splitParagraphs, splitSentences, splitWords, SENSORY_WORDS, EMOTION_WORDS, VULNERABILITY_MARKERS
 * - structuralPatternDetector: analyzeStructuralPatterns (for paragraph metrics)
 */

import type {
  RevelationLevel,
  ParagraphRevelation,
  VulnerabilityAssessment,
  CharacterAnalysisResult,
} from './contentAnalysisTypes';

import {
  splitParagraphs,
  splitSentences,
  splitWords,
  SENSORY_WORDS,
  EMOTION_WORDS,
  VULNERABILITY_MARKERS,
} from '../workshop/scoring/featureExtractor';

import { analyzeStructuralPatterns } from '../workshop/scoring/structuralPatternDetector';

// ============================================================================
// REVELATION LEVEL ORDERING
// ============================================================================

const LEVEL_RANK: Record<RevelationLevel, number> = {
  none: 0,
  direct_statement: 1,
  others_testimony: 2,
  action_description: 3,
  specific_detail: 4,
  internal_process: 5,
  moment_of_choice: 6,
  embodied_experience: 7,
};

function higherLevel(a: RevelationLevel, b: RevelationLevel): RevelationLevel {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b;
}

// ============================================================================
// LEVEL DETECTION REGEXES
// ============================================================================

const MOMENT_OF_CHOICE_PATTERNS = [
  /I could have .{1,50} but (instead|rather|chose)/i,
  /I (chose|decided|picked|opted) to .{1,50} (instead of|rather than|over)/i,
  /part of me wanted .{1,50} but/i,
];

/** Paragraph-level cross-sentence choice detection: "I could have..." + "Instead/But" */
const CROSS_SENTENCE_CHOICE_RE = /I could have/i;
const CROSS_SENTENCE_FOLLOW_RE = /[.!?]\s+(Instead|But instead|Rather|But rather)/i;

const INTERNAL_PROCESS_PATTERNS = [
  /I (wondered|questioned|debated|considered|noticed|asked myself|kept thinking|couldn't stop thinking)/i,
  /(?:maybe|perhaps|what if) .{1,30} (?:I thought|I wondered)/i,
];

const OTHERS_TESTIMONY_PATTERNS = [
  /my (teacher|friend|parent|mom|dad|coach|mentor|counselor|boss|sibling|brother|sister|grandmother|grandfather) (said|told|noticed|mentioned|commented|observed|pointed out)/i,
];

const DIRECT_STATEMENT_PATTERNS = [
  /I am (a |an )?\w+/i,
  /I('m| am) (the kind of|someone who|a person who)/i,
  /I have always been/i,
  /I consider myself/i,
];

// ============================================================================
// PROPER NOUN + NUMBER DETECTION
// ============================================================================

const SENTENCE_START_EXCLUSIONS = new Set([
  'I', 'The', 'A', 'An', 'It', 'This', 'That', 'My', 'We', 'He', 'She',
  'They', 'But', 'And', 'Or', 'So', 'Yet', 'For', 'In', 'On', 'At', 'To',
  'Of', 'By', 'Is', 'Was', 'Are', 'Were', 'Be', 'If', 'As', 'Do', 'Did',
  'Not', 'No', 'Its', 'Our', 'His', 'Her', 'All', 'One', 'Now', 'Then',
  'When', 'Where', 'How', 'What', 'Why', 'Who', 'Which', 'There', 'Here',
  'After', 'Before', 'During', 'While', 'Because', 'Although', 'Since',
  'Until', 'With', 'From', 'Each', 'Every', 'Some', 'Many', 'Most',
]);

/** Count proper nouns (capitalized non-sentence-start words) in a text block */
function countProperNouns(text: string): number {
  const sentences = splitSentences(text);
  let count = 0;
  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    for (let i = 1; i < words.length; i++) {
      const cleaned = words[i].replace(/[^a-zA-Z'-]/g, '');
      if (cleaned.length > 0 && /^[A-Z]/.test(cleaned) && !SENTENCE_START_EXCLUSIONS.has(cleaned)) {
        count++;
      }
    }
  }
  return count;
}

/** Count numbers/quantities in text */
function countNumbers(text: string): number {
  const matches = text.match(/\b\d[\d,]*(?:\.\d+)?\b/g);
  return matches ? matches.length : 0;
}

// ============================================================================
// PER-PARAGRAPH REVELATION DETECTION
// ============================================================================

interface LevelMatch {
  level: RevelationLevel;
  evidence: string;
}

function extractEvidence(sentence: string, maxLen: number): string {
  return sentence.length > maxLen ? sentence.slice(0, maxLen) + '...' : sentence;
}

function testPatternsInParagraph(
  paragraphText: string,
  patterns: RegExp[],
  level: RevelationLevel,
): LevelMatch[] {
  const matches: LevelMatch[] = [];
  const sentences = splitSentences(paragraphText);
  for (const sentence of sentences) {
    for (const pattern of patterns) {
      if (pattern.test(sentence)) {
        matches.push({ level, evidence: extractEvidence(sentence, 80) });
        break; // one match per sentence is enough
      }
    }
  }
  return matches;
}

/** Detect all revelation levels present in a single paragraph */
export function detectParagraphRevelation(paragraphText: string, paragraphIndex: number): ParagraphRevelation {
  const allMatches: LevelMatch[] = [];
  const words = splitWords(paragraphText);

  // Level 7: embodied_experience — sensory + emotion co-occur
  const sensoryCount = words.filter(w => SENSORY_WORDS.has(w)).length;
  const emotionCount = words.filter(w => EMOTION_WORDS.has(w)).length;
  if (sensoryCount > 0 && emotionCount > 0) {
    const sentences = splitSentences(paragraphText);
    // Find a sentence that has both
    for (const sentence of sentences) {
      const sWords = splitWords(sentence);
      const hasSensory = sWords.some(w => SENSORY_WORDS.has(w));
      const hasEmotion = sWords.some(w => EMOTION_WORDS.has(w));
      if (hasSensory && hasEmotion) {
        allMatches.push({ level: 'embodied_experience', evidence: extractEvidence(sentence, 80) });
        break;
      }
    }
    // If no single sentence has both but paragraph does, still count at paragraph level
    if (!allMatches.some(m => m.level === 'embodied_experience') && sensoryCount > 0 && emotionCount > 0) {
      allMatches.push({
        level: 'embodied_experience',
        evidence: extractEvidence(paragraphText, 80),
      });
    }
  }

  // Level 6: moment_of_choice (within-sentence patterns)
  allMatches.push(...testPatternsInParagraph(paragraphText, MOMENT_OF_CHOICE_PATTERNS, 'moment_of_choice'));
  // Cross-sentence: "I could have..." in one sentence + "Instead/But" starting another
  if (CROSS_SENTENCE_CHOICE_RE.test(paragraphText) && CROSS_SENTENCE_FOLLOW_RE.test(paragraphText)) {
    allMatches.push({ level: 'moment_of_choice', evidence: extractEvidence(paragraphText, 80) });
  }

  // Level 5: internal_process
  allMatches.push(...testPatternsInParagraph(paragraphText, INTERNAL_PROCESS_PATTERNS, 'internal_process'));

  // Level 4: specific_detail — proper nouns (not sentence-start) + numbers
  const properNounCount = countProperNouns(paragraphText);
  const numberCount = countNumbers(paragraphText);
  if (properNounCount > 0 && numberCount > 0) {
    allMatches.push({ level: 'specific_detail', evidence: extractEvidence(paragraphText, 80) });
  }

  // Level 3: action_description — high past-tense + low abstract noun ratio
  const structural = analyzeStructuralPatterns(paragraphText);
  const metrics = structural.paragraphs[0]; // single paragraph → index 0
  if (metrics && metrics.pastTenseRatio > 0.3 && metrics.abstractNounRatio < 0.04) {
    allMatches.push({ level: 'action_description', evidence: extractEvidence(paragraphText, 80) });
  }

  // Level 2: others_testimony
  allMatches.push(...testPatternsInParagraph(paragraphText, OTHERS_TESTIMONY_PATTERNS, 'others_testimony'));

  // Level 1: direct_statement
  allMatches.push(...testPatternsInParagraph(paragraphText, DIRECT_STATEMENT_PATTERNS, 'direct_statement'));

  // Compile results
  const levelsPresent: RevelationLevel[] = [...new Set(allMatches.map(m => m.level))];
  const highestLevel: RevelationLevel = levelsPresent.reduce<RevelationLevel>(
    (best, level) => higherLevel(best, level),
    'none',
  );
  const markerCount = allMatches.length;
  const evidence = allMatches.slice(0, 3).map(m => m.evidence);

  return {
    paragraphIndex,
    highestLevel: levelsPresent.length === 0 ? 'none' : highestLevel,
    levelsPresent: levelsPresent.length === 0 ? ['none'] : levelsPresent,
    markerCount,
    evidence,
  };
}

// ============================================================================
// VULNERABILITY ASSESSMENT
// ============================================================================

/** Assess whether vulnerability markers are earned (grounded in detail) or performed */
export function assessVulnerability(text: string): VulnerabilityAssessment {
  const sentences = splitSentences(text);
  let totalVulnCount = 0;
  let earnedCount = 0;
  let performedCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sWords = splitWords(sentences[i]);
    const vulnWordsInSentence = sWords.filter(w => VULNERABILITY_MARKERS.has(w));

    if (vulnWordsInSentence.length === 0) continue;
    totalVulnCount += vulnWordsInSentence.length;

    // Check within 2 sentences for grounding detail (sensory word, proper noun, or number)
    const windowStart = Math.max(0, i - 2);
    const windowEnd = Math.min(sentences.length - 1, i + 2);
    let hasGrounding = false;

    for (let j = windowStart; j <= windowEnd; j++) {
      const windowWords = splitWords(sentences[j]);
      const hasSensory = windowWords.some(w => SENSORY_WORDS.has(w));
      const hasProperNoun = countProperNouns(sentences[j]) > 0;
      const hasNumber = countNumbers(sentences[j]) > 0;
      if (hasSensory || hasProperNoun || hasNumber) {
        hasGrounding = true;
        break;
      }
    }

    if (hasGrounding) {
      earnedCount += vulnWordsInSentence.length;
    } else {
      performedCount += vulnWordsInSentence.length;
    }
  }

  return {
    vulnerabilityMarkerCount: totalVulnCount,
    earnedVulnerabilityCount: earnedCount,
    performedVulnerabilityCount: performedCount,
    isEarned: earnedCount > performedCount,
  };
}

// ============================================================================
// MAIN ANALYSIS
// ============================================================================

/**
 * Analyze character revelation patterns across an essay.
 *
 * Detects 7 levels of character revelation per paragraph, assesses vulnerability,
 * and produces factual observations for LLM context.
 */
export function analyzeCharacterRevelation(text: string): CharacterAnalysisResult {
  if (!text || text.trim().length === 0) {
    return {
      paragraphs: [],
      levelDistribution: { none: 0 },
      peakLevel: 'none',
      peakParagraphIndex: 0,
      vulnerability: {
        vulnerabilityMarkerCount: 0,
        earnedVulnerabilityCount: 0,
        performedVulnerabilityCount: 0,
        isEarned: false,
      },
      observations: ['Empty text — no character signals detected'],
    };
  }

  const paragraphs = splitParagraphs(text);
  const paragraphResults = paragraphs.map((p, i) => detectParagraphRevelation(p, i));

  // Level distribution: count paragraphs where each level is the highest
  const levelDistribution: Partial<Record<RevelationLevel, number>> = {};
  for (const p of paragraphResults) {
    const level = p.highestLevel;
    levelDistribution[level] = (levelDistribution[level] ?? 0) + 1;
  }

  // Peak level and paragraph index (ties: prefer later paragraph — closer to emotional climax)
  let peakLevel: RevelationLevel = 'none';
  let peakParagraphIndex = 0;
  for (const p of paragraphResults) {
    if (LEVEL_RANK[p.highestLevel] >= LEVEL_RANK[peakLevel]) {
      peakLevel = p.highestLevel;
      peakParagraphIndex = p.paragraphIndex;
    }
  }

  // Vulnerability assessment
  const vulnerability = assessVulnerability(text);

  // Build factual observations
  const observations: string[] = [];
  observations.push(`Peak revelation: ${peakLevel} at paragraph ${peakParagraphIndex}`);

  const hasLevel6 = paragraphResults.some(p => p.levelsPresent.includes('moment_of_choice'));
  if (!hasLevel6) {
    observations.push('No moment-of-choice detected');
  }

  const hasLevel7 = paragraphResults.some(p => p.levelsPresent.includes('embodied_experience'));
  if (!hasLevel7) {
    observations.push('No embodied experience detected');
  }

  observations.push(`Vulnerability appears ${vulnerability.isEarned ? 'earned' : 'performed'}`);

  const directStatementOnlyCount = paragraphResults.filter(
    p => p.highestLevel === 'direct_statement',
  ).length;
  if (directStatementOnlyCount > 0) {
    observations.push(`${directStatementOnlyCount} paragraphs at direct_statement level only`);
  }

  return {
    paragraphs: paragraphResults,
    levelDistribution,
    peakLevel,
    peakParagraphIndex,
    vulnerability,
    observations,
  };
}
