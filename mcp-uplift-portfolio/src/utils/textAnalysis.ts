/**
 * TEXT ANALYSIS UTILITIES
 *
 * Functions for repetition detection, similarity scoring, and text comparison
 */

import natural from 'natural';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

/**
 * Calculate similarity between two texts using TF-IDF
 * Returns score from 0 (completely different) to 1 (identical)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  // Normalize texts
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);

  // If texts are very short, use simple overlap
  if (normalized1.length < 50 || normalized2.length < 50) {
    return calculateSimpleOverlap(normalized1, normalized2);
  }

  // Use TF-IDF for longer texts
  const tfidf = new TfIdf();
  tfidf.addDocument(normalized1);
  tfidf.addDocument(normalized2);

  // Calculate cosine similarity
  const terms1 = getTopTerms(tfidf, 0, 50);
  const terms2 = getTopTerms(tfidf, 1, 50);

  return calculateCosineSimilarity(terms1, terms2);
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')  // Remove punctuation
    .replace(/\s+/g, ' ')       // Normalize whitespace
    .trim();
}

/**
 * Calculate simple word overlap for short texts
 */
function calculateSimpleOverlap(text1: string, text2: string): number {
  const words1 = new Set(tokenizer.tokenize(text1));
  const words2 = new Set(tokenizer.tokenize(text2));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Get top terms from TF-IDF document
 */
function getTopTerms(tfidf: any, docIndex: number, count: number): Map<string, number> {
  const terms = new Map<string, number>();

  tfidf.listTerms(docIndex).slice(0, count).forEach((item: any) => {
    terms.set(item.term, item.tfidf);
  });

  return terms;
}

/**
 * Calculate cosine similarity between term vectors
 */
function calculateCosineSimilarity(terms1: Map<string, number>, terms2: Map<string, number>): number {
  const allTerms = new Set([...terms1.keys(), ...terms2.keys()]);

  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  for (const term of allTerms) {
    const val1 = terms1.get(term) || 0;
    const val2 = terms2.get(term) || 0;

    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  }

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

/**
 * Extract overlapping phrases between two texts
 */
export function extractOverlappingContent(text1: string, text2: string, minLength: number = 15): string[] {
  const words1 = tokenizer.tokenize(normalizeText(text1)) || [];
  const words2 = tokenizer.tokenize(normalizeText(text2)) || [];

  const overlaps: string[] = [];

  // Find common n-grams (3-8 words)
  for (let n = 3; n <= 8; n++) {
    const ngrams1 = getNGrams(words1, n);
    const ngrams2 = getNGrams(words2, n);

    for (const ngram1 of ngrams1) {
      for (const ngram2 of ngrams2) {
        if (ngram1 === ngram2 && ngram1.length >= minLength) {
          overlaps.push(ngram1);
        }
      }
    }
  }

  // Remove duplicates and return longest matches first
  return [...new Set(overlaps)].sort((a, b) => b.length - a.length);
}

/**
 * Get n-grams from word array
 */
function getNGrams(words: string[], n: number): string[] {
  const ngrams: string[] = [];

  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }

  return ngrams;
}

/**
 * Categorize similarity score into severity
 */
export function getSimilaritySeverity(score: number): 'critical' | 'major' | 'minor' | 'none' {
  if (score >= 0.7) return 'critical';  // 70%+ overlap
  if (score >= 0.5) return 'major';     // 50-69% overlap
  if (score >= 0.3) return 'minor';     // 30-49% overlap
  return 'none';                         // <30% overlap
}

/**
 * Extract key topics from text
 */
export function extractKeyTopics(text: string, count: number = 10): string[] {
  const tfidf = new TfIdf();
  tfidf.addDocument(normalizeText(text));

  return tfidf.listTerms(0)
    .slice(0, count)
    .map((item: any) => item.term);
}

/**
 * Check if claim appears in text (fuzzy match)
 */
export function findClaimInText(claim: string, text: string, threshold: number = 0.6): boolean {
  const normalizedClaim = normalizeText(claim);
  const normalizedText = normalizeText(text);

  // Exact match
  if (normalizedText.includes(normalizedClaim)) {
    return true;
  }

  // Fuzzy match: check if most words from claim appear in text
  const claimWords = tokenizer.tokenize(normalizedClaim) || [];
  const textWords = new Set(tokenizer.tokenize(normalizedText) || []);

  const matchedWords = claimWords.filter((word: string) => textWords.has(word));
  const matchRatio = matchedWords.length / claimWords.length;

  return matchRatio >= threshold;
}

/**
 * Extract sentences containing specific keywords
 */
export function extractSentencesWithKeywords(text: string, keywords: string[]): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const normalizedKeywords = keywords.map(k => normalizeText(k));

  return sentences.filter(sentence => {
    const normalizedSentence = normalizeText(sentence);
    return normalizedKeywords.some(keyword => normalizedSentence.includes(keyword));
  });
}
