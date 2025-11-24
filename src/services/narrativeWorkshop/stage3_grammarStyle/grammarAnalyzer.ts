// @ts-nocheck
/**
 * Stage 3.1: Grammar & Mechanics Analyzer (Deterministic)
 *
 * Fast deterministic analysis of grammar, sentence structure, and mechanics.
 * NO LLM calls - pure pattern matching and counting.
 *
 * Focus Areas:
 * - Sentence metrics (count, length, variety)
 * - Verb strength (active vs passive, weak vs strong)
 * - Word choice (lexical diversity, clichés, overused words)
 * - Punctuation effectiveness
 * - Paragraph structure
 * - Red flags and green flags
 *
 * Elite Benchmarks (from 20 top essays):
 * - Average sentence length: 15-22 words (not too short, not too long)
 * - Sentence variety: Mix of short (5-10), medium (11-20), long (21+ words)
 * - Passive voice: <15% of sentences
 * - Lexical diversity: 0.55-0.65 (unique words / total words)
 * - Strong verbs: 3+ per 100 words
 * - Elite essays avoid weak verbs ("is," "was," "get," "have")
 *
 * This analyzer is FAST (no API calls) and provides immediate feedback.
 */

import { GrammarAnalysis } from '../types';

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze grammar and mechanics deterministically
 */
export function analyzeGrammar(essayText: string): GrammarAnalysis {
  console.log('  → Stage 3.1: Grammar & Mechanics Analysis (deterministic)');
  const startTime = Date.now();

  try {
    // Sentence analysis
    const sentenceMetrics = analyzeSentenceMetrics(essayText);

    // Verb analysis
    const verbAnalysis = analyzeVerbs(essayText);

    // Word choice analysis
    const wordChoice = analyzeWordChoice(essayText);

    // Punctuation analysis
    const punctuation = analyzePunctuation(essayText);

    // Paragraph analysis
    const paragraphMetrics = analyzeParagraphs(essayText);

    // Detect red flags and green flags
    const redFlags = detectRedFlags(essayText, sentenceMetrics, verbAnalysis, wordChoice);
    const greenFlags = detectGreenFlags(essayText, sentenceMetrics, verbAnalysis, wordChoice);

    const duration = Date.now() - startTime;

    console.log(`     ✓ Grammar analyzed (${duration}ms, deterministic)`);
    console.log(`       Sentences: ${sentenceMetrics.totalSentences}, Avg length: ${sentenceMetrics.averageLength} words`);
    console.log(`       Variety score: ${sentenceMetrics.varietyScore}/10`);
    console.log(`       Passive voice: ${verbAnalysis.passivePercentage.toFixed(1)}%`);
    console.log(`       Lexical diversity: ${wordChoice.lexicalDiversity.toFixed(3)}`);
    console.log(`       Red flags: ${redFlags.length}, Green flags: ${greenFlags.length}`);

    return {
      sentenceMetrics,
      verbAnalysis: {
        activeVoiceCount: verbAnalysis.weakVerbCount, // Placeholder
        passiveVoiceCount: verbAnalysis.passivePercentage,
        passivePercentage: verbAnalysis.passivePercentage,
        weakVerbs: verbAnalysis.weakVerbExamples,
        strongVerbs: verbAnalysis.strongVerbExamples,
      },
      wordChoice: {
        totalWords: wordChoice.totalWords,
        uniqueWords: wordChoice.uniqueWords,
        lexicalDiversity: wordChoice.lexicalDiversity,
        clichePhrases: wordChoice.clicheExamples,
        averageWordLength: wordChoice.averageWordLength,
        overusedWords: wordChoice.overusedWords,
      },
      punctuation: {
        dashUsage: punctuation.dashCount,
        semicolonUsage: punctuation.semicolonCount,
        colonUsage: punctuation.colonCount,
        fragmentCount: punctuation.fragmentCount,
        effectiveness: punctuation.effectiveness,
      },
      paragraphMetrics,
      grammaticalErrors: [],
      redFlags,
      greenFlags,
      overallGrammarScore: calculateOverallGrammarScore(sentenceMetrics, verbAnalysis, wordChoice, redFlags),
      analysisCompletedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('     ✗ Grammar analysis failed:', error);
    throw error;
  }
}

// ============================================================================
// SENTENCE ANALYSIS
// ============================================================================

interface SentenceMetrics {
  totalSentences: number;
  averageLength: number;
  shortSentences: number; // 5-10 words
  mediumSentences: number; // 11-20 words
  longSentences: number; // 21+ words
  varietyScore: number; // 0-10, based on distribution
  longestSentence: number;
  shortestSentence: number;
}

function analyzeSentenceMetrics(essayText: string): SentenceMetrics {
  const sentences = essayText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const totalSentences = sentences.length;

  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);

  const totalWords = sentenceLengths.reduce((sum, len) => sum + len, 0);
  const averageLength = Math.round(totalWords / totalSentences);

  let shortSentences = 0;
  let mediumSentences = 0;
  let longSentences = 0;

  sentenceLengths.forEach(len => {
    if (len >= 5 && len <= 10) shortSentences++;
    else if (len >= 11 && len <= 20) mediumSentences++;
    else if (len >= 21) longSentences++;
  });

  // Variety score: ideal is balanced mix
  const shortRatio = shortSentences / totalSentences;
  const mediumRatio = mediumSentences / totalSentences;
  const longRatio = longSentences / totalSentences;

  // Ideal: 20-30% short, 50-60% medium, 15-25% long
  let varietyScore = 10;
  if (shortRatio < 0.15 || shortRatio > 0.35) varietyScore -= 2;
  if (mediumRatio < 0.40 || mediumRatio > 0.70) varietyScore -= 2;
  if (longRatio < 0.10 || longRatio > 0.30) varietyScore -= 2;
  if (averageLength < 12 || averageLength > 25) varietyScore -= 2;

  varietyScore = Math.max(0, Math.min(10, varietyScore));

  const longestSentence = Math.max(...sentenceLengths);
  const shortestSentence = Math.min(...sentenceLengths);

  return {
    totalSentences,
    averageLength,
    shortSentences,
    mediumSentences,
    longSentences,
    varietyScore,
    longestSentence,
    shortestSentence
  };
}

// ============================================================================
// VERB ANALYSIS
// ============================================================================

interface VerbAnalysis {
  activeVerbCount: number;
  passiveVerbCount: number;
  passivePercentage: number;
  weakVerbCount: number;
  strongVerbCount: number;
  weakVerbExamples: string[];
  strongVerbExamples: string[];
}

function analyzeVerbs(essayText: string): VerbAnalysis {
  const text = essayText.toLowerCase();
  const sentences = essayText.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Passive voice detection
  const passivePattern = /\b(am|is|are|was|were|been|being) (\w+ed|gotten|given|taken|made|done|seen|known|found|kept|left|felt|heard)\b/gi;
  const passiveMatches = essayText.match(passivePattern) || [];
  const passiveVerbCount = passiveMatches.length;
  const passivePercentage = (passiveVerbCount / sentences.length) * 100;

  // Weak verbs (overused, generic)
  const weakVerbPatterns = [
    /\b(is|am|are|was|were)\b/gi,
    /\bget(s|ting|)?\b/gi,
    /\bhave|has|had\b/gi,
    /\bmake|makes|made\b/gi,
    /\bgo|goes|went\b/gi,
    /\bdo|does|did\b/gi,
  ];

  const weakVerbExamples: string[] = [];
  let weakVerbCount = 0;

  weakVerbPatterns.forEach(pattern => {
    const matches = essayText.match(pattern) || [];
    weakVerbCount += matches.length;
    weakVerbExamples.push(...matches.slice(0, 2)); // Top 2 examples per pattern
  });

  // Strong verbs (action-oriented, specific)
  const strongVerbPatterns = [
    /\b(created|built|designed|developed|launched|initiated|founded|established)\b/gi,
    /\b(secured|recruited|organized|coordinated|led|managed|directed)\b/gi,
    /\b(transformed|revolutionized|pioneered|innovated|solved|resolved)\b/gi,
    /\b(analyzed|synthesized|examined|explored|discovered|uncovered)\b/gi,
    /\b(grabbed|seized|clutched|gripped|thrust|lunged)\b/gi,
    /\b(whispered|shouted|muttered|exclaimed|declared|announced)\b/gi,
  ];

  const strongVerbExamples: string[] = [];
  let strongVerbCount = 0;

  strongVerbPatterns.forEach(pattern => {
    const matches = essayText.match(pattern) || [];
    strongVerbCount += matches.length;
    strongVerbExamples.push(...matches.slice(0, 2));
  });

  // Active verb count (rough approximation)
  const activeVerbCount = sentences.length - passiveVerbCount;

  return {
    activeVerbCount,
    passiveVerbCount,
    passivePercentage: Math.round(passivePercentage * 10) / 10,
    weakVerbCount,
    strongVerbCount,
    weakVerbExamples: weakVerbExamples.slice(0, 5),
    strongVerbExamples: strongVerbExamples.slice(0, 5)
  };
}

// ============================================================================
// WORD CHOICE ANALYSIS
// ============================================================================

interface WordChoiceAnalysis {
  totalWords: number;
  uniqueWords: number;
  lexicalDiversity: number;
  averageWordLength: number;
  clicheCount: number;
  clicheExamples: string[];
  overusedWords: Array<{ word: string; count: number }>;
  advancedVocabulary: string[];
}

function analyzeWordChoice(essayText: string): WordChoiceAnalysis {
  const wordsMatch = essayText.toLowerCase().match(/\b[a-z]+\b/gi);
  const words: string[] = wordsMatch || [];
  const totalWords = words.length;

  const uniqueWordsSet = new Set(words);
  const uniqueWords = uniqueWordsSet.size;
  const lexicalDiversity = totalWords > 0 ? uniqueWords / totalWords : 0;

  const totalChars = words.reduce((sum, word) => sum + word.length, 0);
  const averageWordLength = totalWords > 0 ? Math.round((totalChars / totalWords) * 10) / 10 : 0;

  // Detect clichés
  const clichePatterns = [
    /\bat the end of the day\b/gi,
    /\bthink outside the box\b/gi,
    /\bpush(ed)? (me )?(out of|outside) my comfort zone\b/gi,
    /\bfound my passion\b/gi,
    /\banything is possible\b/gi,
    /\bchanged my life\b/gi,
    /\bthe importance of\b/gi,
    /\bgrow(ing)? as a person\b/gi,
    /\bmade me who i am today\b/gi,
    /\bever since i was (young|a child)\b/gi,
  ];

  const clicheExamples: string[] = [];
  clichePatterns.forEach(pattern => {
    const matches = essayText.match(pattern) || [];
    clicheExamples.push(...matches);
  });

  const clicheCount = clicheExamples.length;

  // Overused words (excluding common stop words)
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'it', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);

  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    const lower = word.toLowerCase();
    if (!stopWords.has(lower) && lower.length > 3) {
      wordFreq.set(lower, (wordFreq.get(lower) || 0) + 1);
    }
  });

  const overusedWords = Array.from(wordFreq.entries())
    .filter(([_, count]) => count >= 4) // Used 4+ times
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Advanced vocabulary (SAT-level words)
  const advancedVocabPatterns = [
    /\b(juxtaposition|dichotomy|paradigm|nuance|ephemeral|ubiquitous)\b/gi,
    /\b(serendipity|ameliorate|catalyst|culmination|symbiosis)\b/gi,
    /\b(intrinsic|extrinsic|inherent|intricate|meticulous)\b/gi,
  ];

  const advancedVocabulary: string[] = [];
  advancedVocabPatterns.forEach(pattern => {
    const matches = essayText.match(pattern) || [];
    advancedVocabulary.push(...matches);
  });

  return {
    totalWords,
    uniqueWords,
    lexicalDiversity: Math.round(lexicalDiversity * 1000) / 1000,
    averageWordLength,
    clicheCount,
    clicheExamples: clicheExamples.slice(0, 5),
    overusedWords,
    advancedVocabulary: advancedVocabulary.slice(0, 5)
  };
}

// ============================================================================
// PUNCTUATION ANALYSIS
// ============================================================================

interface PunctuationAnalysis {
  exclamationCount: number;
  questionCount: number;
  dashCount: number;
  semicolonCount: number;
  colonCount: number;
  fragmentCount: number;
  effectiveness: number;
  flags: string[];
}

function analyzePunctuation(essayText: string): PunctuationAnalysis {
  const exclamationCount = (essayText.match(/!/g) || []).length;
  const questionCount = (essayText.match(/\?/g) || []).length;
  const dashCount = (essayText.match(/—|–/g) || []).length;
  const semicolonCount = (essayText.match(/;/g) || []).length;
  const colonCount = (essayText.match(/:/g) || []).length;

  const flags: string[] = [];

  if (exclamationCount > 3) {
    flags.push(`Overuse of exclamation marks (${exclamationCount}) - can feel immature`);
  }

  if (questionCount > 5) {
    flags.push(`Many rhetorical questions (${questionCount}) - can weaken authority`);
  }

  if (semicolonCount > 5) {
    flags.push(`Heavy semicolon use (${semicolonCount}) - ensure correct usage`);
  }

  return {
    exclamationCount,
    questionCount,
    dashCount,
    semicolonCount,
    colonCount,
    fragmentCount: 0, // TODO: Implement fragment detection
    effectiveness: 7, // TODO: Calculate effectiveness score
    flags
  };
}

// ============================================================================
// PARAGRAPH ANALYSIS
// ============================================================================

interface ParagraphMetrics {
  totalParagraphs: number;
  averageSentencesPerParagraph: number;
  singleSentenceParagraphs: number;
  flags: string[];
}

function analyzeParagraphs(essayText: string): ParagraphMetrics {
  const paragraphs = essayText.split(/\n\n+/).filter(p => p.trim().length > 0);
  const totalParagraphs = paragraphs.length;

  let totalSentences = 0;
  let singleSentenceParagraphs = 0;

  paragraphs.forEach(para => {
    const sentences = para.split(/[.!?]+/).filter(s => s.trim().length > 0);
    totalSentences += sentences.length;
    if (sentences.length === 1) singleSentenceParagraphs++;
  });

  const averageSentencesPerParagraph = Math.round((totalSentences / totalParagraphs) * 10) / 10;

  const flags: string[] = [];

  if (totalParagraphs < 3) {
    flags.push('Very few paragraphs - consider breaking into more sections');
  }

  if (totalParagraphs > 15) {
    flags.push('Many short paragraphs - consider combining some');
  }

  if (singleSentenceParagraphs > totalParagraphs * 0.3) {
    flags.push(`${singleSentenceParagraphs} single-sentence paragraphs - can feel choppy`);
  }

  return {
    totalParagraphs,
    averageSentencesPerParagraph,
    singleSentenceParagraphs,
    flags
  };
}

// ============================================================================
// RED FLAGS & GREEN FLAGS
// ============================================================================

function detectRedFlags(
  essayText: string,
  sentenceMetrics: SentenceMetrics,
  verbAnalysis: VerbAnalysis,
  wordChoice: WordChoiceAnalysis
): string[] {
  const flags: string[] = [];

  // Sentence issues
  if (sentenceMetrics.averageLength < 10) {
    flags.push('MAJOR: Average sentence too short (< 10 words) - may feel choppy');
  }
  if (sentenceMetrics.averageLength > 30) {
    flags.push('MAJOR: Average sentence too long (> 30 words) - may lose reader');
  }
  if (sentenceMetrics.varietyScore < 5) {
    flags.push('MAJOR: Low sentence variety - monotonous rhythm');
  }

  // Verb issues
  if (verbAnalysis.passivePercentage > 20) {
    flags.push(`MAJOR: High passive voice (${verbAnalysis.passivePercentage.toFixed(1)}%) - elite essays <15%`);
  }
  if (verbAnalysis.strongVerbCount === 0) {
    flags.push('MAJOR: No strong action verbs detected');
  }

  // Word choice issues
  if (wordChoice.lexicalDiversity < 0.50) {
    flags.push(`MAJOR: Low lexical diversity (${wordChoice.lexicalDiversity.toFixed(3)}) - repetitive language`);
  }
  if (wordChoice.clicheCount >= 3) {
    flags.push(`CRITICAL: ${wordChoice.clicheCount} clichés detected - hurts authenticity`);
  }

  return flags;
}

function detectGreenFlags(
  essayText: string,
  sentenceMetrics: SentenceMetrics,
  verbAnalysis: VerbAnalysis,
  wordChoice: WordChoiceAnalysis
): string[] {
  const flags: string[] = [];

  // Sentence strengths
  if (sentenceMetrics.varietyScore >= 8) {
    flags.push('Excellent sentence variety - creates engaging rhythm');
  }
  if (sentenceMetrics.averageLength >= 15 && sentenceMetrics.averageLength <= 22) {
    flags.push('Ideal average sentence length (15-22 words)');
  }

  // Verb strengths
  if (verbAnalysis.passivePercentage < 10) {
    flags.push('Strong active voice - engaging and direct');
  }
  if (verbAnalysis.strongVerbCount >= 5) {
    flags.push(`${verbAnalysis.strongVerbCount} strong action verbs - demonstrates agency`);
  }

  // Word choice strengths
  if (wordChoice.lexicalDiversity >= 0.60) {
    flags.push(`High lexical diversity (${wordChoice.lexicalDiversity.toFixed(3)}) - sophisticated vocabulary`);
  }
  if (wordChoice.clicheCount === 0) {
    flags.push('No clichés detected - authentic voice');
  }
  if (wordChoice.advancedVocabulary.length >= 3) {
    flags.push(`${wordChoice.advancedVocabulary.length} advanced vocabulary words - intellectual depth`);
  }

  return flags;
}

// ============================================================================
// OVERALL SCORE
// ============================================================================

function calculateOverallGrammarScore(
  sentenceMetrics: SentenceMetrics,
  verbAnalysis: VerbAnalysis,
  wordChoice: WordChoiceAnalysis,
  redFlags: string[]
): number {
  let score = 10;

  // Sentence variety penalty
  if (sentenceMetrics.varietyScore < 7) score -= 1;
  if (sentenceMetrics.varietyScore < 5) score -= 1;

  // Passive voice penalty
  if (verbAnalysis.passivePercentage > 15) score -= 1;
  if (verbAnalysis.passivePercentage > 25) score -= 1;

  // Lexical diversity penalty
  if (wordChoice.lexicalDiversity < 0.55) score -= 1;
  if (wordChoice.lexicalDiversity < 0.50) score -= 1;

  // Cliché penalty
  if (wordChoice.clicheCount >= 1) score -= 1;
  if (wordChoice.clicheCount >= 3) score -= 2;

  // Red flag penalty
  score -= redFlags.length * 0.5;

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

