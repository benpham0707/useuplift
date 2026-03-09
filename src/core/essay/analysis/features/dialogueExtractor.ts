// @ts-nocheck - Legacy analysis file with type mismatches
/**
 * Dialogue Extractor for Essay Analysis
 *
 * Extracts and analyzes quoted speech in essays. Dialogue adds voice,
 * immediacy, and characterization when used purposefully.
 *
 * Quality criteria:
 * - Dialogue must be doing narrative work (not decorative)
 * - Should reveal character, advance plot, or create tension
 * - Must be integrated into scene (not floating)
 *
 * Quality Framework Alignment:
 * - Depth: Analyzes both presence and quality of dialogue
 * - Explainability: Returns exact quotes and context
 * - Test-first: Clear input/output contracts
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DialogueExtraction {
  has_dialogue: boolean;
  dialogue_count: number;
  dialogues: ExtractedDialogue[];
  overall_dialogue_score: number; // 0-10
  evidence_summary: string;
}

export interface ExtractedDialogue {
  quote: string;
  speaker_context?: string; // Who said it (if identifiable)
  surrounding_context: string; // Sentences before/after
  narrative_function: 'reveals_character' | 'advances_plot' | 'creates_tension' | 'adds_voice' | 'decorative';
  quality_score: number; // 0-10
  location_in_essay: {
    paragraph_index: number;
    sentence_index: number;
  };
}

// ============================================================================
// PATTERNS
// ============================================================================

// Dialogue attribution verbs
const ATTRIBUTION_VERBS = [
  'said', 'asked', 'replied', 'answered', 'whispered', 'shouted', 'yelled',
  'muttered', 'murmured', 'explained', 'continued', 'added', 'responded',
  'interrupted', 'insisted', 'declared', 'announced', 'stammered'
];

// Patterns for quoted speech
const QUOTE_PATTERNS = [
  /"([^"]{5,})"/g,        // Double quotes (min 5 chars to avoid short fragments)
  /'([^']{5,})'/g,        // Single quotes
  /[""]([^""]{5,})["]/g,  // Smart quotes
];

// Context indicators (helps determine if dialogue is integrated)
const CONTEXT_INDICATORS = [
  /\bI (said|asked|replied|answered|whispered|shouted)\b/i,
  /\b(he|she|they|mom|dad|teacher|coach|doctor|counselor) (said|asked|replied|answered|whispered|shouted)\b/i,
  /\bturning to (me|him|her|them)\b/i,
  /\blooking (at|toward) (me|him|her|them)\b/i,
];

// ============================================================================
// EXTRACTOR FUNCTIONS
// ============================================================================

/**
 * Main dialogue extraction function
 */
export function extractDialogue(essayText: string): DialogueExtraction {
  const paragraphs = splitIntoParagraphs(essayText);
  const dialogues: ExtractedDialogue[] = [];

  paragraphs.forEach((para, paraIndex) => {
    const sentences = splitIntoSentences(para);

    sentences.forEach((sentence, sentIndex) => {
      // Find all quotes in this sentence
      const quotes = findQuotes(sentence);

      quotes.forEach(quote => {
        const dialogue = analyzeDialogue(
          quote,
          sentence,
          para,
          { paragraph_index: paraIndex, sentence_index: sentIndex }
        );

        if (dialogue) {
          dialogues.push(dialogue);
        }
      });
    });
  });

  // Calculate overall score
  const overall_dialogue_score = calculateDialogueScore(dialogues);

  return {
    has_dialogue: dialogues.length > 0,
    dialogue_count: dialogues.length,
    dialogues,
    overall_dialogue_score,
    evidence_summary: generateDialogueSummary(dialogues),
  };
}

/**
 * Find all quoted text in a sentence
 */
function findQuotes(sentence: string): string[] {
  const quotes: string[] = [];

  for (const pattern of QUOTE_PATTERNS) {
    const matches = sentence.matchAll(pattern);
    for (const match of matches) {
      quotes.push(match[1] || match[0]);
    }
  }

  return [...new Set(quotes)]; // Deduplicate
}

/**
 * Analyze a piece of dialogue for quality and function
 */
function analyzeDialogue(
  quote: string,
  sentence: string,
  paragraph: string,
  location: { paragraph_index: number; sentence_index: number }
): ExtractedDialogue | null {
  // Filter out very short quotes (likely not actual dialogue)
  if (quote.length < 5) return null;

  // Determine speaker context
  const speaker_context = identifySpeaker(sentence, paragraph);

  // Get surrounding context
  const surrounding_context = getSurroundingContext(paragraph, sentence);

  // Determine narrative function
  const narrative_function = determineNarrativeFunction(quote, surrounding_context);

  // Calculate quality score
  const quality_score = scoreDialogue(quote, sentence, paragraph, narrative_function);

  return {
    quote,
    speaker_context,
    surrounding_context,
    narrative_function,
    quality_score,
    location_in_essay: location,
  };
}

/**
 * Identify who is speaking (if possible)
 */
function identifySpeaker(sentence: string, paragraph: string): string | undefined {
  // Look for attribution verbs with subjects
  for (const verb of ATTRIBUTION_VERBS) {
    const pattern = new RegExp(`\\b(I|he|she|they|\\w+)\\s+${verb}\\b`, 'i');
    const match = sentence.match(pattern) || paragraph.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Get surrounding context (sentences before/after if available)
 */
function getSurroundingContext(paragraph: string, sentence: string): string {
  const sentences = splitIntoSentences(paragraph);
  const index = sentences.indexOf(sentence);

  if (index === -1) return sentence;

  const before = index > 0 ? sentences[index - 1] : '';
  const after = index < sentences.length - 1 ? sentences[index + 1] : '';

  return [before, sentence, after].filter(Boolean).join(' ').slice(0, 200);
}

/**
 * Determine what narrative work the dialogue is doing
 */
function determineNarrativeFunction(quote: string, context: string): ExtractedDialogue['narrative_function'] {
  const lowerQuote = quote.toLowerCase();
  const lowerContext = context.toLowerCase();

  // Check for character revelation (emotions, beliefs, personality)
  const emotion_words = ['afraid', 'scared', 'happy', 'sad', 'angry', 'confused', 'worried', 'excited'];
  const belief_words = ['think', 'believe', 'know', 'feel', 'realize', 'understand'];

  if (emotion_words.some(w => lowerQuote.includes(w)) || belief_words.some(w => lowerQuote.includes(w))) {
    return 'reveals_character';
  }

  // Check for plot advancement (questions, decisions, plans)
  const question_markers = ['?', 'what', 'why', 'how', 'when', 'where', 'should'];
  const decision_markers = ['will', 'going to', 'plan', 'need to', 'have to', 'must'];

  if (question_markers.some(w => lowerQuote.includes(w))) {
    return 'creates_tension';
  }

  if (decision_markers.some(w => lowerQuote.includes(w))) {
    return 'advances_plot';
  }

  // Check for distinctive voice
  const voice_markers = ['slang', 'dialect', 'unique phrasing'];
  if (lowerQuote.length > 20 && !lowerQuote.match(/^(yes|no|okay|alright)$/)) {
    return 'adds_voice';
  }

  // Default to decorative if no clear function
  return 'decorative';
}

/**
 * Score dialogue quality (0-10)
 */
function scoreDialogue(
  quote: string,
  sentence: string,
  paragraph: string,
  narrative_function: ExtractedDialogue['narrative_function']
): number {
  let score = 0;

  // Base score for having dialogue
  score += 2;

  // Bonus for narrative function
  const function_scores = {
    reveals_character: 3,
    creates_tension: 3,
    advances_plot: 2,
    adds_voice: 2,
    decorative: 0,
  };
  score += function_scores[narrative_function];

  // Bonus for attribution (shows integration)
  const has_attribution = ATTRIBUTION_VERBS.some(verb =>
    sentence.toLowerCase().includes(verb)
  );
  if (has_attribution) score += 2;

  // Bonus for surrounding context (not floating)
  const has_context = CONTEXT_INDICATORS.some(pattern =>
    paragraph.match(pattern)
  );
  if (has_context) score += 2;

  // Penalty for very short dialogue (less meaningful)
  if (quote.length < 15) score -= 1;

  // Bonus for longer, substantive dialogue
  if (quote.length > 40) score += 1;

  return Math.max(0, Math.min(10, score));
}

/**
 * Calculate overall dialogue score (0-10)
 */
function calculateDialogueScore(dialogues: ExtractedDialogue[]): number {
  if (dialogues.length === 0) return 0;

  // Base score for having dialogue
  let score = Math.min(3, dialogues.length);

  // Quality bonus from best dialogues
  const sorted = dialogues.sort((a, b) => b.quality_score - a.quality_score);
  const top_2_avg = sorted.slice(0, 2).reduce((sum, d) => sum + d.quality_score, 0) / Math.min(2, sorted.length);
  score += top_2_avg * 0.7;

  // Bonus for variety of functions
  const functions = new Set(dialogues.map(d => d.narrative_function));
  if (functions.size > 1) score += 1;

  return Math.round(Math.min(10, score) * 10) / 10;
}

/**
 * Generate human-readable summary
 */
function generateDialogueSummary(dialogues: ExtractedDialogue[]): string {
  if (dialogues.length === 0) {
    return 'No dialogue detected. Consider adding quoted speech to bring scenes to life.';
  }

  const functions = dialogues.reduce((acc, d) => {
    acc[d.narrative_function] = (acc[d.narrative_function] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const parts: string[] = [`${dialogues.length} instance${dialogues.length > 1 ? 's' : ''} of dialogue`];

  if (functions.reveals_character) {
    parts.push(`${functions.reveals_character} revealing character`);
  }
  if (functions.creates_tension) {
    parts.push(`${functions.creates_tension} creating tension`);
  }
  if (functions.advances_plot) {
    parts.push(`${functions.advances_plot} advancing plot`);
  }

  return parts.join('; ') + '.';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ============================================================================
// SCORING HELPERS
// ============================================================================

/**
 * Map dialogue extraction to rubric score (0-10)
 */
export function dialogueExtractionToRubricScore(extraction: DialogueExtraction): number {
  return extraction.overall_dialogue_score;
}

/**
 * Get evidence quotes for rubric dimension
 */
export function getDialogueEvidence(extraction: DialogueExtraction): string[] {
  return extraction.dialogues
    .slice(0, 3)
    .map(d => `"${d.quote}" (${d.narrative_function})`);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default extractDialogue;
