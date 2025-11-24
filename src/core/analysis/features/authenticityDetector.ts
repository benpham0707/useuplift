/**
 * Authenticity Detector
 *
 * Identifies manufactured, essay-voice, or "trying too hard" content
 * vs. genuine, conversational, lived-experience narratives.
 *
 * Based on analysis of real successful admissions essays.
 */

// ============================================================================
// RED FLAGS: "Trying Too Hard" / Manufactured Content
// ============================================================================

/**
 * Phrases that signal manufactured-for-admissions content
 */
export const MANUFACTURED_PHRASES = [
  // Formulaic reflection starters
  'i used to think',
  'i once believed',
  'before this experience',
  'looking back now',
  'in retrospect',

  // Essay-voice constructions
  'this taught me that',
  'through this i learned',
  'from this experience',
  'i came to realize',
  'i came to understand',

  // Overly dramatic
  'changed my life',
  'transformed who i am',
  'shaped the person i am today',
  'defined my future',
  'altered my perspective forever',

  // SAT-word showing off
  'plethora',
  'myriad',
  'multitude',
  'abundance',
  'culmination',

  // Generic transitions
  'moreover',
  'furthermore',
  'in addition',
  'consequently',
  'thus',
];

/**
 * Abstract/forced sensory language (BAD)
 * vs. Concrete sensory details (GOOD - don't flag these)
 */
export const ABSTRACT_SENSORY_PHRASES = [
  'smelled like ambition',
  'smelled like success',
  'smelled like possibility',
  'tasted like victory',
  'tasted like triumph',
  'felt like silk',
  'felt like electricity',
  'felt like magic',
  'echoed through',
  'hung in the air',
];

/**
 * Patterns that indicate forced narrative arc
 */
export const FORCED_ARC_PATTERNS = [
  /but then.*realized/i,
  /until.*moment.*understood/i,
  /suddenly.*dawned on me/i,
  /that's when.*clicked/i,
  /in that instant.*changed/i,
];

/**
 * Signs of authentic, conversational voice
 */
const AUTHENTIC_VOICE_MARKERS = [
  // Direct address / questions
  /\?/,  // Questions
  /have i/i,
  /should i/i,
  /you could/i,
  /you might/i,

  // Conversational sentence starters
  /^no\./,
  /^yes\./,
  /^but /,
  /^and /,
  /^or /,
  /^so /,

  // List-like constructions (like Jimmy's Hot Dogs)
  /:\s*\$/,  // Prices
  /\.\s*[A-Z][^.]*\.\s*[A-Z][^.]*\./,  // Short staccato sentences

  // Unexpected openings
  /^do re mi/i,
  /^regular dog/i,
  /^\d+/,  // Starting with numbers

  // Informal language
  /\bhoney\b/i,
  /\boh man\b/i,
  /\bnope\b/i,
  /\byep\b/i,
  /\buh\b/i,
];

/**
 * Real-world specificity markers (vs. vague descriptors)
 */
const REAL_SPECIFICITY_MARKERS = [
  // Proper nouns
  /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/,  // Names like "Baba Joon"

  // Technical terms / jargon
  /\bmock trial\b/i,
  /\be-?board\b/i,
  /\bnon-?profit status\b/i,
  /\bISEF\b/,
  /\bsantur\b/i,

  // Specific amounts
  /\$[\d,]+/,
  /\d+K\s+(sigs|signatures)/i,
  /\d+\s+AUD\b/,

  // Menu items, product names, etc.
  /:\s*\$\d/,  // Price lists
  /\b[A-Z][a-z]+['']s\s+[A-Z][a-z]+\b/,  // "Jimmy's Hot Dogs"
];

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

export interface AuthenticityAnalysis {
  authenticity_score: number;  // 0-10, higher = more authentic
  manufactured_signals: string[];
  authentic_signals: string[];
  voice_type: 'conversational' | 'essay' | 'mixed' | 'robotic';
  red_flags: string[];
  green_flags: string[];
}

/**
 * Analyze text for authenticity vs. manufactured content
 */
export function analyzeAuthenticity(text: string): AuthenticityAnalysis {
  const lowerText = text.toLowerCase();

  // Count manufactured signals
  const manufacturedFound = MANUFACTURED_PHRASES.filter(phrase =>
    lowerText.includes(phrase)
  );

  // Check for abstract/forced sensory language (separate from concrete sensory details)
  const abstractSensoryFound = ABSTRACT_SENSORY_PHRASES.filter(phrase =>
    lowerText.includes(phrase)
  );

  const forcedArcFound = FORCED_ARC_PATTERNS.filter(pattern =>
    pattern.test(text)
  ).map(p => p.toString());

  // Count authentic signals
  const authenticFound = AUTHENTIC_VOICE_MARKERS.filter(pattern =>
    pattern.test(text)
  );

  const realSpecificsFound = REAL_SPECIFICITY_MARKERS.filter(pattern =>
    pattern.test(text)
  );

  // Detect conversational markers
  const hasQuestions = (text.match(/\?/g) || []).length;
  const hasShortSentences = text.split(/[.!?]/).filter(s =>
    s.trim().split(/\s+/).length < 6
  ).length;
  const hasDialogue = /["'].*["']/.test(text);
  const hasUnexpectedOpening = /^[^A-Z]/.test(text.trim()) || /^(Do|No|Yes|Regular|My)\s/.test(text);

  // Red flags for manufactured content
  const redFlags: string[] = [];

  if (manufacturedFound.length >= 3) {
    redFlags.push('excessive_manufactured_phrases');
  }
  if (forcedArcFound.length >= 2) {
    redFlags.push('forced_narrative_arc');
  }
  // Only flag abstract/metaphorical sensory language, not concrete details
  if (abstractSensoryFound.length >= 1) {
    redFlags.push('trying_too_hard_sensory');
  }
  if (/i used to think.*but.*learned/i.test(text)) {
    redFlags.push('formulaic_reflection');
  }
  if (manufacturedFound.length > 0 && authenticFound.length === 0) {
    redFlags.push('pure_essay_voice');
  }

  // Detect SAT-word showing off
  const satWords = ['plethora', 'myriad', 'multitude', 'culmination', 'proliferation'];
  const satWordCount = satWords.filter(w => lowerText.includes(w)).length;
  if (satWordCount >= 2) {
    redFlags.push('vocabulary_showing_off');
  }

  // Green flags for authentic content
  const greenFlags: string[] = [];

  if (hasQuestions >= 2) {
    greenFlags.push('conversational_questions');
  }
  if (hasShortSentences >= 3) {
    greenFlags.push('staccato_authentic_rhythm');
  }
  if (hasDialogue) {
    greenFlags.push('real_dialogue');
  }
  if (hasUnexpectedOpening) {
    greenFlags.push('bold_unconventional_opening');
  }
  if (realSpecificsFound.length >= 3) {
    greenFlags.push('real_world_specifics');
  }
  if (authenticFound.length >= 3) {
    greenFlags.push('conversational_voice');
  }

  // Determine voice type
  let voiceType: 'conversational' | 'essay' | 'mixed' | 'robotic';

  if (redFlags.length >= 3) {
    voiceType = 'robotic';
  } else if (authenticFound.length >= manufacturedFound.length * 1.5) {
    voiceType = 'conversational';
  } else if (manufacturedFound.length >= authenticFound.length * 1.5) {
    voiceType = 'essay';
  } else {
    voiceType = 'mixed';
  }

  // Calculate authenticity score (0-10)
  let authenticityScore = 6;  // Start slightly above neutral (less harsh)

  // Boost for authentic markers
  authenticityScore += Math.min(3, authenticFound.length * 0.5);
  authenticityScore += Math.min(2, realSpecificsFound.length * 0.3);
  authenticityScore += greenFlags.length * 0.4;

  // Penalize for manufactured markers (reduced penalties)
  authenticityScore -= Math.min(3, manufacturedFound.length * 0.3);  // Reduced from 0.4
  authenticityScore -= forcedArcFound.length * 0.6;  // Reduced from 0.8
  authenticityScore -= abstractSensoryFound.length * 0.5;  // Only penalize abstract sensory
  authenticityScore -= redFlags.length * 0.4;  // Reduced from 0.6

  // Clamp to 0-10
  authenticityScore = Math.max(0, Math.min(10, authenticityScore));
  authenticityScore = Math.round(authenticityScore * 10) / 10;

  return {
    authenticity_score: authenticityScore,
    manufactured_signals: [...manufacturedFound, ...abstractSensoryFound, ...forcedArcFound.map(p => `Pattern: ${p}`)],
    authentic_signals: [...authenticFound.map(p => `Pattern: ${p}`), ...realSpecificsFound.map(p => `Real specific: ${p}`)],
    voice_type: voiceType,
    red_flags: redFlags,
    green_flags: greenFlags,
  };
}

/**
 * Compare to real successful examples
 */
export function compareToSuccessfulExamples(text: string): {
  similarity_to: string[];
  narrative_structure: string;
  strengths: string[];
  warnings: string[];
} {
  const authenticity = analyzeAuthenticity(text);
  const similarTo: string[] = [];
  const strengths: string[] = [];
  const warnings: string[] = [];

  // Check for "Uncommon Connections" structure (like Santur essay)
  if (/(?:imagine|reminds me|connects me to)/i.test(text)) {
    similarTo.push('Uncommon Connections (Santur-style)');
  }

  // Check for "Challenge-Based" structure (like Catalyzing Creativity)
  if (/(?:problem|challenge|wondered|decided to start)/i.test(text)) {
    similarTo.push('Challenge-Based (Shark Tank style)');
  }

  // Check for "Personal Growth" structure (like Moonlight Sonata)
  if (/(?:four.*months ago|used to|now|before|after)/i.test(text)) {
    similarTo.push('Personal Growth arc');
  }

  // Check for creative metaphor (like Newspaper relationship)
  if (/(?:relationship|love-hate|typical|like a)/i.test(text)) {
    similarTo.push('Creative Metaphor framing');
  }

  // Check for Jimmy's Hot Dogs style (staccato, conversational)
  if (authenticity.green_flags.includes('staccato_authentic_rhythm')) {
    similarTo.push('Staccato Conversational (Jimmy\'s style)');
    strengths.push('Bold, unconventional structure');
  }

  // Warnings based on authenticity analysis
  if (authenticity.voice_type === 'essay') {
    warnings.push('Essay voice detected - sounds written FOR admissions rather than FROM the heart');
  }
  if (authenticity.voice_type === 'robotic') {
    warnings.push('CRITICAL: Robotic/manufactured tone - complete rewrite needed');
  }
  if (authenticity.red_flags.includes('trying_too_hard_sensory')) {
    warnings.push('Forced sensory details feel inauthentic - remove or replace with genuine observations');
  }
  if (authenticity.red_flags.includes('formulaic_reflection')) {
    warnings.push('Reflection follows template ("I used to think...but learned") - needs genuine insight');
  }

  // Strengths
  if (authenticity.green_flags.includes('conversational_questions')) {
    strengths.push('Conversational questions create authentic voice');
  }
  if (authenticity.green_flags.includes('real_dialogue')) {
    strengths.push('Dialogue makes story come alive');
  }
  if (authenticity.green_flags.includes('real_world_specifics')) {
    strengths.push('Concrete specifics (names, prices, tech terms) build credibility');
  }

  const narrativeStructure = similarTo.length > 0
    ? similarTo[0]
    : authenticity.voice_type === 'conversational'
      ? 'Conversational/Informal'
      : 'Traditional essay structure';

  return {
    similarity_to: similarTo,
    narrative_structure: narrativeStructure,
    strengths,
    warnings,
  };
}

/**
 * Score adjustment recommendations based on authenticity
 */
export function getAuthenticityScoreAdjustments(authenticityScore: number): {
  voice_adjustment: number;
  craft_adjustment: number;
  overall_penalty: number;
  explanation: string;
} {
  let voiceAdj = 0;
  let craftAdj = 0;
  let penalty = 0;
  let explanation = '';

  if (authenticityScore >= 8) {
    voiceAdj = +2;
    craftAdj = +1;
    explanation = 'Highly authentic voice - boost Voice Integrity and Craft scores';
  } else if (authenticityScore >= 6) {
    voiceAdj = 0;
    craftAdj = 0;
    explanation = 'Moderately authentic - no adjustment needed';
  } else if (authenticityScore >= 4) {
    voiceAdj = -1;
    craftAdj = -0.5;
    penalty = -5;
    explanation = 'Somewhat manufactured - penalize Voice and apply NQI penalty';
  } else {
    voiceAdj = -2;
    craftAdj = -1;
    penalty = -10;
    explanation = 'CRITICAL: Robotic/manufactured content - major penalties across the board';
  }

  return {
    voice_adjustment: voiceAdj,
    craft_adjustment: craftAdj,
    overall_penalty: penalty,
    explanation,
  };
}
