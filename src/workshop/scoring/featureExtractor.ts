/**
 * Feature Extractor — Deterministic Text Analysis Engine
 *
 * Extracts structural, syntactic, and semantic features from essay text.
 * All analysis is deterministic (no LLM calls). Target: ~50ms for 650 words.
 *
 * Used by all 13 dimension scorers as input to their heuristic functions.
 */

import type { ExtractedFeatures } from '../shared/types';

// ============================================================================
// WORD LISTS FOR DETECTION
// ============================================================================

export const SENSORY_WORDS = new Set([
  // Visual
  'bright', 'dim', 'glowing', 'shadowed', 'vivid', 'pale', 'crimson', 'golden',
  'flickering', 'gleaming', 'shimmering', 'blinding', 'dark', 'light', 'color',
  // Auditory
  'whisper', 'roar', 'hum', 'buzz', 'crack', 'echo', 'silence', 'murmur',
  'thunder', 'ring', 'clatter', 'screech', 'sigh', 'rustle', 'click',
  // Tactile
  'rough', 'smooth', 'cold', 'warm', 'sharp', 'soft', 'wet', 'dry',
  'sticky', 'slippery', 'burning', 'freezing', 'prickly', 'velvet', 'gritty',
  // Olfactory/Gustatory
  'sweet', 'bitter', 'sour', 'pungent', 'fragrant', 'stench', 'aroma',
  'musty', 'fresh', 'rotten', 'spicy', 'metallic', 'earthy', 'smoky',
]);

export const EMOTION_WORDS = new Set([
  'afraid', 'angry', 'anxious', 'ashamed', 'bitter', 'confused', 'desperate',
  'disappointed', 'embarrassed', 'excited', 'frustrated', 'grateful', 'guilty',
  'happy', 'heartbroken', 'helpless', 'hopeful', 'humiliated', 'jealous',
  'joyful', 'lonely', 'nervous', 'overwhelmed', 'panicked', 'peaceful',
  'proud', 'regretful', 'relieved', 'resentful', 'sad', 'scared', 'shocked',
  'terrified', 'thrilled', 'torn', 'uncertain', 'vulnerable', 'worried',
  'devastated', 'elated', 'furious', 'grief', 'horror', 'love', 'rage',
]);

export const VULNERABILITY_MARKERS = new Set([
  'afraid', 'scared', 'terrified', 'ashamed', 'embarrassed', 'humiliated',
  'failed', 'failure', 'mistake', 'wrong', 'regret', 'guilt', 'shame',
  'weakness', 'flaw', 'struggle', 'doubt', 'uncertain', 'insecure',
  'helpless', 'powerless', 'vulnerable', 'broke', 'crying', 'tears',
  'confession', 'admit', 'honest', 'truth', 'painful', 'hurt', 'fear',
]);

export const ACHIEVEMENT_MARKERS = new Set([
  'won', 'award', 'champion', 'first place', 'top', 'best', 'president',
  'founded', 'started', 'led', 'managed', 'organized', 'achieved',
  'recognition', 'honor', 'scholarship', 'selected', 'published',
  'created', 'built', 'launched', 'invented', 'discovered', 'earned',
]);

export const REFLECTION_MARKERS = new Set([
  'realized', 'understood', 'learned', 'discovered', 'recognized',
  'now I see', 'looking back', 'in retrospect', 'it dawned on me',
  'I came to understand', 'this taught me', 'I began to see',
  'shifted my perspective', 'changed my view', 'opened my eyes',
  'made me question', 'forced me to reconsider', 'I now believe',
]);

export const GROWTH_LANGUAGE = new Set([
  'grew', 'growth', 'evolved', 'transformed', 'changed', 'developed',
  'improved', 'matured', 'progressed', 'overcame', 'adapted',
  'became', 'turned into', 'shifted', 'transition', 'journey',
  'before and after', 'used to', 'now I', 'no longer',
]);

export const CURIOSITY_MARKERS = new Set([
  'wondered', 'curious', 'fascinated', 'intrigued', 'explored',
  'researched', 'investigated', 'questioned', 'puzzled', 'obsessed',
  'deep dive', 'rabbit hole', 'couldn\'t stop', 'wanted to know',
  'discovery', 'experiment', 'hypothesis', 'theory', 'why',
]);

export const CLICHES = new Set([
  'since i was young', 'ever since i was a child', 'passionate about',
  'made me who i am', 'changed my life', 'opened my eyes',
  'taught me the importance of', 'i learned that', 'in today\'s society',
  'at the end of the day', 'it was a turning point', 'made a difference',
  'global citizen', 'unique perspective', 'diverse background',
  'outside my comfort zone', 'think outside the box', 'never give up',
  'follow your dreams', 'hard work pays off', 'everything happens for a reason',
  'the best version of myself', 'truly humbling', 'transformative experience',
]);

export const FILLER_PHRASES = new Set([
  'in order to', 'the fact that', 'it is important to note that',
  'at this point in time', 'due to the fact that', 'in the process of',
  'on a daily basis', 'for all intents and purposes', 'needless to say',
  'it goes without saying', 'as a matter of fact', 'at the end of the day',
  'by and large', 'first and foremost', 'last but not least',
  'in my opinion', 'i believe that', 'i think that',
]);

export const TRANSITION_WORDS = new Set([
  'however', 'moreover', 'furthermore', 'nevertheless', 'consequently',
  'therefore', 'additionally', 'meanwhile', 'subsequently', 'likewise',
  'conversely', 'similarly', 'in contrast', 'on the other hand',
  'as a result', 'for instance', 'for example', 'in addition',
  'in particular', 'specifically', 'ultimately', 'indeed',
]);

const CLAIM_INDICATORS = [
  /\bi (?:believe|argue|contend|maintain|assert) that\b/i,
  /\bthe (?:key|core|central|fundamental) (?:point|argument|claim|thesis) is\b/i,
  /\bthis (?:shows|demonstrates|proves|reveals|suggests) that\b/i,
  /\bit is (?:clear|evident|obvious|apparent) that\b/i,
  /\bwe (?:must|should|need to)\b/i,
];

const EVIDENCE_INDICATORS = [
  /\bfor (?:example|instance)\b/i,
  /\bsuch as\b/i,
  /\baccording to\b/i,
  /\bresearch (?:shows|suggests|indicates)\b/i,
  /\bstudies (?:show|suggest|indicate)\b/i,
  /\bdata (?:shows|suggests|indicates)\b/i,
  /\bspecifically\b/i,
  /\bin fact\b/i,
];

const COUNTERPOINT_INDICATORS = [
  /\balthough\b/i,
  /\bdespite\b/i,
  /\bhowever\b/i,
  /\bon the other hand\b/i,
  /\bnevertheless\b/i,
  /\bwhile (?:it is|some|many)\b/i,
  /\badmittedly\b/i,
  /\bsome (?:might|may|could) argue\b/i,
  /\bcritics (?:say|argue|point out)\b/i,
  /\bit('s| is) (?:true|fair) that\b/i,
];

const RHETORICAL_PATTERNS = [
  // Anaphora (repeated beginnings)
  /^(.{5,30})\n.*?\1/m,
  // Parallelism
  /(\w+ing .+?), (\w+ing .+?), (?:and )?(\w+ing .+?)/i,
  // Tricolon
  /(.+?), (.+?), and (.+?)\./,
  // Rhetorical question
  /[^.!]\?/,
];

// ============================================================================
// SENTENCE SPLITTING
// ============================================================================

export function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or end
  return text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

export function splitWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z'\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

// ============================================================================
// PASSIVE VOICE DETECTION (approximate)
// ============================================================================

export const PASSIVE_PATTERN = /\b(?:am|is|are|was|were|been|being)\s+\w+(?:ed|en|t)\b/gi;

// ============================================================================
// MAIN EXTRACTOR
// ============================================================================

class FeatureExtractor {
  /**
   * Extract all features from essay text.
   * Deterministic, ~50ms for 650 words.
   */
  extract(text: string): ExtractedFeatures {
    const words = splitWords(text);
    const sentences = splitSentences(text);
    const paragraphs = splitParagraphs(text);
    const lowerText = text.toLowerCase();

    // Word-level stats
    const wordCount = words.length;
    const uniqueWords = new Set(words);
    const uniqueWordCount = uniqueWords.size;
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / Math.max(wordCount, 1);
    const vocabularyRichness = uniqueWordCount / Math.max(wordCount, 1);

    // Sentence-level stats
    const sentenceCount = sentences.length;
    const sentenceLengths = sentences.map(s => splitWords(s).length);
    const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / Math.max(sentenceCount, 1);
    const sentenceLengthVariance = this.variance(sentenceLengths);
    const shortSentenceRatio = sentenceLengths.filter(l => l < 8).length / Math.max(sentenceCount, 1);
    const longSentenceRatio = sentenceLengths.filter(l => l > 25).length / Math.max(sentenceCount, 1);

    // Paragraph-level stats
    const paragraphCount = paragraphs.length;
    const paragraphSentenceCounts = paragraphs.map(p => splitSentences(p).length);
    const avgParagraphLength = paragraphSentenceCounts.reduce((a, b) => a + b, 0) / Math.max(paragraphCount, 1);

    // Structural patterns
    const firstSentence = sentences[0] || '';
    const hasOpeningScene = this.detectOpeningScene(firstSentence, sentences.slice(0, 3).join(' '));
    const dialogueMatches = text.match(/[""\u201C\u201D].+?[""\u201C\u201D]/g) || [];
    const hasDialogue = dialogueMatches.length > 0;
    const dialogueCount = dialogueMatches.length;
    const questionMatches = text.match(/[^.!]\?/g) || [];
    const hasQuestions = questionMatches.length > 0;
    const questionCount = questionMatches.length;

    // Transition words
    const transitionWordCount = this.countSetMatches(words, TRANSITION_WORDS);

    // Paragraph transition quality (simple heuristic: % of paragraphs starting with transition)
    const paragraphTransitionQuality = paragraphs.length > 1
      ? paragraphs.slice(1).filter(p => {
          const firstWord = splitWords(p)[0] || '';
          return TRANSITION_WORDS.has(firstWord);
        }).length / (paragraphs.length - 1)
      : 0;

    // Keyword/phrase detection
    const sensoryDetailCount = this.countSetMatches(words, SENSORY_WORDS);
    const emotionWordCount = this.countSetMatches(words, EMOTION_WORDS);
    const vulnerabilityMarkerCount = this.countSetMatches(words, VULNERABILITY_MARKERS);
    const achievementMarkerCount = this.countSetMatches(words, ACHIEVEMENT_MARKERS);
    const reflectionMarkerCount = this.countPhraseMatches(lowerText, REFLECTION_MARKERS);
    const clicheCount = this.countPhraseMatches(lowerText, CLICHES);
    const bannedTermCount = this.countBannedTerms(lowerText);
    const fillerPhraseCount = this.countPhraseMatches(lowerText, FILLER_PHRASES);

    // Syntactic features
    const passiveMatches = text.match(PASSIVE_PATTERN) || [];
    const passiveVoiceRatio = passiveMatches.length / Math.max(sentenceCount, 1);
    const clauseDepthAvg = this.estimateClauseDepth(sentences);
    const sentenceVarietyScore = this.calculateSentenceVariety(sentenceLengths);

    // Rhetorical features
    const claimCount = CLAIM_INDICATORS.reduce((count, re) => count + (text.match(re) || []).length, 0);
    const evidenceCount = EVIDENCE_INDICATORS.reduce((count, re) => count + (text.match(re) || []).length, 0);
    const counterpointCount = COUNTERPOINT_INDICATORS.reduce((count, re) => count + (text.match(re) || []).length, 0);
    const rhetoricalDeviceCount = RHETORICAL_PATTERNS.reduce((count, re) => count + (text.match(re) || []).length, 0);

    // Voice/tone features
    const formalityScore = this.estimateFormality(words, text);
    const firstPersonWords = words.filter(w => ['i', 'me', 'my', 'mine', 'myself'].includes(w));
    const firstPersonRate = firstPersonWords.length / Math.max(wordCount, 1);
    const contractions = text.match(/\w+'\w+/g) || [];
    const contractionRate = contractions.length / Math.max(sentenceCount, 1);

    // Growth/curiosity markers
    const growthLanguageCount = this.countSetMatches(words, GROWTH_LANGUAGE);
    const curiosityMarkerCount = this.countSetMatches(words, CURIOSITY_MARKERS);
    const researchReferenceCount = this.countResearchReferences(lowerText);

    return {
      wordCount,
      uniqueWordCount,
      avgWordLength,
      vocabularyRichness,
      sentenceCount,
      avgSentenceLength,
      sentenceLengthVariance,
      shortSentenceRatio,
      longSentenceRatio,
      paragraphCount,
      avgParagraphLength,
      hasOpeningScene,
      hasDialogue,
      dialogueCount,
      hasQuestions,
      questionCount,
      transitionWordCount,
      paragraphTransitionQuality,
      sensoryDetailCount,
      emotionWordCount,
      vulnerabilityMarkerCount,
      achievementMarkerCount,
      reflectionMarkerCount,
      clicheCount,
      bannedTermCount,
      fillerPhraseCount,
      passiveVoiceRatio,
      clauseDepthAvg,
      sentenceVarietyScore,
      claimCount,
      evidenceCount,
      counterpointCount,
      rhetoricalDeviceCount,
      formalityScore,
      firstPersonRate,
      contractionRate,
      growthLanguageCount,
      curiosityMarkerCount,
      researchReferenceCount,
      rawText: text,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private variance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  }

  private countSetMatches(words: string[], set: Set<string>): number {
    return words.filter(w => set.has(w)).length;
  }

  private countPhraseMatches(lowerText: string, phrases: Set<string>): number {
    let count = 0;
    for (const phrase of phrases) {
      if (lowerText.includes(phrase)) count++;
    }
    return count;
  }

  private countBannedTerms(lowerText: string): number {
    const banned = [
      'delve', 'tapestry', 'myriad', 'multifaceted', 'beacon',
      'realm', 'landscape', 'paradigm', 'synergy', 'catalyst',
      'transformative', 'holistic', 'nuanced', 'pivotal', 'profound impact',
      'embark', 'foster', 'leverage', 'navigate', 'resonate',
    ];
    return banned.filter(t => lowerText.includes(t)).length;
  }

  private detectOpeningScene(firstSentence: string, firstParagraph: string): boolean {
    const lower = firstParagraph.toLowerCase();
    // Check for temporal anchors
    const temporalAnchors = /\b(when|at|on|during|one|that)\b.*\b(morning|night|day|evening|summer|winter|year|moment|second|minute)\b/i;
    // Check for sensory details
    const sensoryPresent = splitWords(firstSentence).some(w => SENSORY_WORDS.has(w));
    // Check for specific location markers
    const locationMarkers = /\b(in the|at the|on the|inside|outside|behind|above|below|corner|room|door|window|street|kitchen|classroom|stage|field)\b/i;
    // Check for dialogue in opening
    const hasDialogue = /[""\u201C\u201D]/.test(firstSentence);
    // Check for action verbs in past tense
    const actionVerbs = /\b(walked|ran|sat|stood|grabbed|opened|closed|turned|looked|heard|felt|saw|reached|picked|pulled)\b/i;

    return temporalAnchors.test(lower) ||
           (sensoryPresent && locationMarkers.test(lower)) ||
           hasDialogue ||
           actionVerbs.test(firstSentence);
  }

  private estimateClauseDepth(sentences: string[]): number {
    if (sentences.length === 0) return 0;
    const depths = sentences.map(s => {
      // Count clause-introducing markers
      const markers = (s.match(/,\s*(who|which|that|where|when|while|although|because|since|if|unless|before|after)\b/gi) || []).length;
      return 1 + markers;
    });
    return depths.reduce((a, b) => a + b, 0) / depths.length;
  }

  private calculateSentenceVariety(lengths: number[]): number {
    if (lengths.length < 3) return 0.5;

    // Measure how many distinct length "buckets" are used
    const buckets = new Set(lengths.map(l => {
      if (l <= 5) return 'tiny';
      if (l <= 10) return 'short';
      if (l <= 18) return 'medium';
      if (l <= 25) return 'long';
      return 'very_long';
    }));

    // Also check for alternating patterns (short-long-short)
    let alternations = 0;
    for (let i = 1; i < lengths.length; i++) {
      const prevBucket = lengths[i - 1] <= 12 ? 'short' : 'long';
      const currBucket = lengths[i] <= 12 ? 'short' : 'long';
      if (prevBucket !== currBucket) alternations++;
    }
    const alternationRatio = alternations / Math.max(lengths.length - 1, 1);

    // Combine bucket diversity and alternation
    const bucketScore = Math.min(buckets.size / 4, 1); // 4+ buckets = 1.0
    return (bucketScore * 0.6) + (alternationRatio * 0.4);
  }

  private estimateFormality(words: string[], text: string): number {
    let formalSignals = 0;
    let informalSignals = 0;

    // Formal signals
    if (text.match(/\b(furthermore|moreover|consequently|nevertheless|nonetheless)\b/gi)) formalSignals += 2;
    if (text.match(/\b(therefore|thus|hence|accordingly)\b/gi)) formalSignals += 1;
    const avgWordLen = words.reduce((s, w) => s + w.length, 0) / Math.max(words.length, 1);
    if (avgWordLen > 5.5) formalSignals += 1;

    // Informal signals
    const contractions = (text.match(/\w+'\w+/g) || []).length;
    if (contractions > 3) informalSignals += 2;
    if (text.match(/\b(gonna|wanna|kinda|sorta|gotta|y'all|ain't)\b/gi)) informalSignals += 3;
    const firstPerson = words.filter(w => w === 'i').length;
    if (firstPerson > 5) informalSignals += 1;
    if (text.match(/!/g)?.length ?? 0 > 2) informalSignals += 1;

    const total = formalSignals + informalSignals;
    if (total === 0) return 0.5; // neutral
    return formalSignals / total; // 0 = very informal, 1 = very formal
  }

  private countResearchReferences(lowerText: string): number {
    const patterns = [
      /\b(study|studies|research|paper|journal|article|publication)\b/g,
      /\b(professor|dr\.|scientist|researcher|author)\b/g,
      /\b(according to|as .+ found|data shows|evidence suggests)\b/g,
      /\b(experiment|hypothesis|theory|methodology|analysis)\b/g,
    ];
    return patterns.reduce((count, re) => count + (lowerText.match(re) || []).length, 0);
  }
}

/** Singleton feature extractor */
export const featureExtractor = new FeatureExtractor();
export { FeatureExtractor };
