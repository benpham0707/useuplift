/**
 * Essay Element Detector
 *
 * Detects which structural element of an essay a given passage belongs to.
 * This enables context-aware technique recommendations - different elements
 * benefit from different approaches.
 *
 * For example:
 * - Opening hooks benefit from voice/storytelling OR intellectual provocation
 * - Evidence sections benefit from metrics/technical depth, NOT more narrative
 * - Reflection moments need depth and complexity, not just story continuation
 */

import { SupplementalType } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type EssayElement =
  | 'opening_hook'        // First 1-2 sentences - grab attention
  | 'context_setup'       // Background/situation establishment
  | 'action_body'         // Main narrative or argument development
  | 'evidence_section'    // Data, examples, proof of claims
  | 'reflection_moment'   // Processing/meaning-making
  | 'insight_revelation'  // Key realization or unique perspective
  | 'connection_bridge'   // Linking to school/major/future
  | 'closing_synthesis'   // Final impression/callback
  | 'transition';         // Between major sections

export interface ElementPosition {
  start: number;  // Character index
  end: number;    // Character index
  sentenceStart: number;  // Sentence index
  sentenceEnd: number;    // Sentence index
}

export interface ElementAnalysis {
  element: EssayElement;
  position: ElementPosition;
  confidence: number;  // 0-1
  signals: string[];   // What patterns led to this classification
  currentStrengths: ElementStrength[];
  gaps: ElementGap[];
}

export interface ElementStrength {
  type: 'storytelling' | 'evidence' | 'reflection' | 'voice' | 'specificity' | 'connection';
  description: string;
  examples: string[];  // Quoted text demonstrating the strength
}

export interface ElementGap {
  type: 'missing_evidence' | 'shallow_reflection' | 'generic_insight' | 'weak_connection' | 'over_narrated' | 'missing_voice';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  location: string;  // Where in the element the gap appears
}

export interface FullEssayStructure {
  elements: ElementAnalysis[];
  overallPattern: EssayStructurePattern;
  balanceAnalysis: BalanceAnalysis;
  recommendations: StructureRecommendation[];
}

export type EssayStructurePattern =
  | 'narrative_heavy'      // Mostly storytelling, light on reflection/evidence
  | 'reflection_heavy'     // Lots of telling, not enough showing
  | 'evidence_heavy'       // Data-focused, missing personal voice
  | 'balanced'             // Good mix of elements
  | 'fragmented'           // Jumps between elements without cohesion
  | 'front_loaded'         // Strong opening, weak middle/end
  | 'back_loaded';         // Weak opening, strong conclusion

export interface BalanceAnalysis {
  storytellingPercent: number;
  reflectionPercent: number;
  evidencePercent: number;
  connectionPercent: number;
  idealBalance: Record<string, number>;  // What this essay type should aim for
  imbalanceAreas: string[];
}

export interface StructureRecommendation {
  element: EssayElement;
  currentApproach: string;
  recommendedApproach: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * Patterns that signal different essay elements
 */
const ELEMENT_SIGNALS: Record<EssayElement, {
  startPatterns: RegExp[];
  contentPatterns: RegExp[];
  structuralCues: string[];
  typicalPosition: 'start' | 'early' | 'middle' | 'late' | 'end' | 'any';
}> = {
  opening_hook: {
    startPatterns: [
      /^["']/,  // Starts with dialogue
      /^(The|A|My|I|When|At|In|On|It)\b/i,  // Common opening words
      /^[A-Z][a-z]+,/,  // Name followed by comma
    ],
    contentPatterns: [
      /^\S+\s+\S+\s+\S+\s+\S+\s+\S+$/,  // Very short (5 words or less)
      /[?!]$/,  // Ends with question or exclamation
      /^"[^"]+"/,  // Dialogue
    ],
    structuralCues: ['first sentence', 'opening line', 'hook'],
    typicalPosition: 'start',
  },

  context_setup: {
    startPatterns: [
      /^(For|Since|Before|After|During|Throughout|Growing up|As a)/i,
      /^(My|Our|The)\s+(family|school|community|team|club)/i,
    ],
    contentPatterns: [
      /\b(background|context|situation|setting)\b/i,
      /\b(always|never|every|each)\s+(day|week|year|time)/i,
      /\b(grew up|raised|born|lived)\b/i,
    ],
    structuralCues: ['background', 'context', 'setting', 'before'],
    typicalPosition: 'early',
  },

  action_body: {
    startPatterns: [
      /^(Then|Next|After|When|One day|That)/i,
      /^(I|We)\s+(started|began|decided|went|made|took)/i,
    ],
    contentPatterns: [
      /\b(did|made|created|built|organized|led|started)\b/i,
      /\b(happened|occurred|took place)\b/i,
      /\b(first|then|next|finally|after that)\b/i,
      /[""](.*?)[""]/,  // Contains dialogue
    ],
    structuralCues: ['narrative', 'action', 'event', 'story'],
    typicalPosition: 'middle',
  },

  evidence_section: {
    startPatterns: [
      /^(This|The|Our|My)\s+(result|outcome|impact|effect)/i,
      /^(We|I)\s+(achieved|accomplished|reached|increased|decreased)/i,
    ],
    contentPatterns: [
      /\d+%/,  // Percentages
      /\$[\d,]+/,  // Dollar amounts
      /\b\d+\s*(people|students|members|hours|days|weeks|months)\b/i,
      /\b(doubled|tripled|increased|decreased|grew|reduced)\s+by\b/i,
      /\b(result|outcome|impact|effect|achievement)\b/i,
    ],
    structuralCues: ['evidence', 'data', 'results', 'metrics', 'proof'],
    typicalPosition: 'middle',
  },

  reflection_moment: {
    startPatterns: [
      /^(Looking back|In hindsight|Now|Today|This experience|What I)/i,
      /^(I\s+)?(realized|learned|understood|discovered|recognized)/i,
    ],
    contentPatterns: [
      /\b(realized|learned|understood|discovered|recognized|saw|noticed)\b/i,
      /\b(taught me|showed me|made me|helped me)\b/i,
      /\b(meaning|significance|importance|value|impact)\b/i,
      /\b(growth|change|transformation|shift|evolution)\b/i,
    ],
    structuralCues: ['reflection', 'learning', 'insight', 'realization'],
    typicalPosition: 'late',
  },

  insight_revelation: {
    startPatterns: [
      /^(What I|The real|True|Ultimately|At its core)/i,
      /^(I now|I've come to|I understand that)/i,
    ],
    contentPatterns: [
      /\b(but|however|yet|although|despite)\b.*\b(also|simultaneously|at the same time)\b/i,
      /\b(complexity|nuance|tension|paradox|contradiction)\b/i,
      /\b(not just|more than|beyond|deeper than)\b/i,
      /\b(unique|original|different|unconventional)\b/i,
    ],
    structuralCues: ['insight', 'revelation', 'key takeaway', 'unique perspective'],
    typicalPosition: 'late',
  },

  connection_bridge: {
    startPatterns: [
      /^(At|This is why|That's why|This experience|These skills)/i,
      /^(.*)(will|want to|hope to|plan to|intend to)/i,
    ],
    contentPatterns: [
      /\b(college|university|school|program|major|department)\b/i,
      /\b(course|class|professor|research|lab|opportunity)\b/i,
      /\b(future|career|goal|aspiration|dream|vision)\b/i,
      /\b(contribute|bring|offer|add|apply)\b/i,
    ],
    structuralCues: ['connection', 'fit', 'future', 'application'],
    typicalPosition: 'late',
  },

  closing_synthesis: {
    startPatterns: [
      /^(Ultimately|In the end|Looking forward|Moving forward|As I)/i,
      /^(This|These|My)\s+(experience|journey|story|path)/i,
    ],
    contentPatterns: [
      /\b(continue|continue to|keep|maintain|carry)\b/i,
      /\b(shaped|defined|transformed|changed)\s+me\b/i,
      /\b(who I am|the person|my identity)\b/i,
      // Callback patterns - references to opening
    ],
    structuralCues: ['conclusion', 'synthesis', 'closing', 'final'],
    typicalPosition: 'end',
  },

  transition: {
    startPatterns: [
      /^(But|However|Yet|Still|Meanwhile|At the same time)/i,
      /^(This|That|These|Those)\s+(led|brought|took)/i,
    ],
    contentPatterns: [
      /\b(however|but|yet|nevertheless|nonetheless)\b/i,
      /\b(transition|shift|change|turn|pivot)\b/i,
      /\b(led to|resulted in|brought about|caused)\b/i,
    ],
    structuralCues: ['transition', 'shift', 'turn'],
    typicalPosition: 'any',
  },
};

/**
 * What each essay type should ideally balance
 */
const IDEAL_BALANCE_BY_TYPE: Record<SupplementalType, {
  storytelling: number;
  reflection: number;
  evidence: number;
  connection: number;
}> = {
  extracurricular: { storytelling: 35, reflection: 25, evidence: 25, connection: 15 },
  why_us: { storytelling: 15, reflection: 20, evidence: 35, connection: 30 },
  why_major: { storytelling: 20, reflection: 25, evidence: 30, connection: 25 },
  intellectual: { storytelling: 15, reflection: 35, evidence: 20, connection: 30 },
  challenge: { storytelling: 40, reflection: 35, evidence: 10, connection: 15 },
  diversity: { storytelling: 35, reflection: 35, evidence: 10, connection: 20 },
  community: { storytelling: 30, reflection: 25, evidence: 25, connection: 20 },
  leadership: { storytelling: 30, reflection: 25, evidence: 30, connection: 15 },
  creative: { storytelling: 45, reflection: 30, evidence: 5, connection: 20 },
  values: { storytelling: 25, reflection: 40, evidence: 15, connection: 20 },
  future_goals: { storytelling: 15, reflection: 25, evidence: 25, connection: 35 },
  additional_info: { storytelling: 20, reflection: 20, evidence: 40, connection: 20 },
  short_answer: { storytelling: 20, reflection: 25, evidence: 30, connection: 25 },
  optional: { storytelling: 25, reflection: 30, evidence: 25, connection: 20 },
};

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Split essay into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Handle abbreviations and edge cases
  const cleaned = text
    .replace(/Dr\./g, 'Dr')
    .replace(/Mr\./g, 'Mr')
    .replace(/Mrs\./g, 'Mrs')
    .replace(/Ms\./g, 'Ms')
    .replace(/Prof\./g, 'Prof')
    .replace(/etc\./g, 'etc')
    .replace(/i\.e\./g, 'ie')
    .replace(/e\.g\./g, 'eg');

  // Split on sentence boundaries
  const sentences = cleaned.split(/(?<=[.!?])\s+(?=[A-Z"])/);

  return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Calculate position category based on sentence index
 */
function getPositionCategory(
  sentenceIndex: number,
  totalSentences: number
): 'start' | 'early' | 'middle' | 'late' | 'end' {
  const position = sentenceIndex / totalSentences;

  if (position === 0 || sentenceIndex === 0) return 'start';
  if (position < 0.2) return 'early';
  if (position < 0.6) return 'middle';
  if (position < 0.85) return 'late';
  return 'end';
}

/**
 * Score how well a passage matches an element type
 */
function scoreElementMatch(
  passage: string,
  element: EssayElement,
  position: 'start' | 'early' | 'middle' | 'late' | 'end'
): { score: number; signals: string[] } {
  const signals = ELEMENT_SIGNALS[element];
  let score = 0;
  const matchedSignals: string[] = [];

  // Check start patterns (high weight for first sentence of passage)
  const firstSentence = passage.split(/[.!?]/)[0] || passage;
  for (const pattern of signals.startPatterns) {
    if (pattern.test(firstSentence)) {
      score += 0.3;
      matchedSignals.push(`start pattern: ${pattern.source.slice(0, 30)}`);
    }
  }

  // Check content patterns
  for (const pattern of signals.contentPatterns) {
    const matches = passage.match(pattern);
    if (matches) {
      score += 0.2;
      matchedSignals.push(`content: ${matches[0].slice(0, 30)}`);
    }
  }

  // Position bonus/penalty
  if (signals.typicalPosition === position) {
    score += 0.3;
    matchedSignals.push(`position match: ${position}`);
  } else if (signals.typicalPosition === 'any') {
    score += 0.1;
  } else {
    // Penalty for wrong position
    const positionDistance = getPositionDistance(signals.typicalPosition, position);
    score -= positionDistance * 0.15;
  }

  return { score: Math.max(0, Math.min(1, score)), signals: matchedSignals };
}

/**
 * Calculate distance between position categories
 */
function getPositionDistance(
  expected: 'start' | 'early' | 'middle' | 'late' | 'end' | 'any',
  actual: 'start' | 'early' | 'middle' | 'late' | 'end'
): number {
  if (expected === 'any') return 0;

  const positions = ['start', 'early', 'middle', 'late', 'end'];
  const expectedIdx = positions.indexOf(expected);
  const actualIdx = positions.indexOf(actual);

  return Math.abs(expectedIdx - actualIdx);
}

/**
 * Detect strengths in a passage
 */
function detectStrengths(passage: string): ElementStrength[] {
  const strengths: ElementStrength[] = [];

  // Check for storytelling strength
  const dialogueMatches = passage.match(/[""][^""]+[""]/g);
  const sensoryWords = passage.match(/\b(saw|heard|felt|smelled|tasted|touched|cold|warm|bright|dark|loud|quiet)\b/gi);
  if (dialogueMatches || sensoryWords) {
    strengths.push({
      type: 'storytelling',
      description: 'Uses vivid storytelling techniques',
      examples: [...(dialogueMatches || []), ...(sensoryWords || [])].slice(0, 3),
    });
  }

  // Check for evidence strength
  const metrics = passage.match(/\d+%|\$[\d,]+|\b\d+\s*(people|students|hours|members)\b/gi);
  if (metrics) {
    strengths.push({
      type: 'evidence',
      description: 'Includes quantifiable evidence',
      examples: metrics.slice(0, 3),
    });
  }

  // Check for reflection strength
  const reflectionPhrases = passage.match(/\b(realized|learned|understood|this taught me|I discovered)\b[^.]*\./gi);
  if (reflectionPhrases) {
    strengths.push({
      type: 'reflection',
      description: 'Shows thoughtful reflection',
      examples: reflectionPhrases.slice(0, 2),
    });
  }

  // Check for voice strength
  const voiceIndicators = passage.match(/\b(honestly|actually|frankly|I think|in my view|to me)\b/gi);
  const informalTone = passage.match(/[—–]|\.{3}|\([^)]+\)/g);
  if (voiceIndicators || informalTone) {
    strengths.push({
      type: 'voice',
      description: 'Authentic personal voice',
      examples: [...(voiceIndicators || []), ...(informalTone || [])].slice(0, 3),
    });
  }

  // Check for specificity strength
  const specificDetails = passage.match(/\b(specifically|particular|exact|precise|named|called)\b[^.]*\./gi);
  const properNouns = passage.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g);
  if (specificDetails || (properNouns && properNouns.length > 1)) {
    strengths.push({
      type: 'specificity',
      description: 'Includes specific details',
      examples: [...(specificDetails || []), ...(properNouns || [])].slice(0, 3),
    });
  }

  // Check for connection strength
  const connectionPhrases = passage.match(/\b(will|want to|hope to|plan to|at [A-Z][a-z]+|this program|this major)\b[^.]*\./gi);
  if (connectionPhrases) {
    strengths.push({
      type: 'connection',
      description: 'Makes clear connections',
      examples: connectionPhrases.slice(0, 2),
    });
  }

  return strengths;
}

/**
 * Detect gaps in a passage based on element type
 */
function detectGaps(
  passage: string,
  element: EssayElement,
  strengths: ElementStrength[],
  essayType: SupplementalType
): ElementGap[] {
  const gaps: ElementGap[] = [];
  const strengthTypes = new Set(strengths.map(s => s.type));

  // Element-specific gap detection
  switch (element) {
    case 'evidence_section':
      if (!strengthTypes.has('evidence')) {
        gaps.push({
          type: 'missing_evidence',
          severity: 'major',
          description: 'Evidence section lacks quantifiable metrics or specific outcomes',
          location: 'throughout',
        });
      }
      break;

    case 'reflection_moment':
      if (!strengthTypes.has('reflection')) {
        gaps.push({
          type: 'shallow_reflection',
          severity: 'major',
          description: 'Reflection lacks depth - states what was learned without showing how or why',
          location: 'throughout',
        });
      }
      // Check for generic insights
      if (/\b(taught me|learned|realized)\b.*\b(important|valuable|meaningful)\b/i.test(passage)) {
        gaps.push({
          type: 'generic_insight',
          severity: 'major',
          description: 'Reflection uses generic language - insight could apply to anyone',
          location: 'key phrases',
        });
      }
      break;

    case 'insight_revelation':
      if (!passage.match(/\b(but|however|yet|although|despite|not just|more than)\b/i)) {
        gaps.push({
          type: 'generic_insight',
          severity: 'major',
          description: 'Missing complexity or nuance in insight - appears too simple or obvious',
          location: 'main claim',
        });
      }
      break;

    case 'connection_bridge':
      if (!strengthTypes.has('connection') || !strengthTypes.has('specificity')) {
        gaps.push({
          type: 'weak_connection',
          severity: 'critical',
          description: 'Connection to school/major lacks specific details',
          location: 'throughout',
        });
      }
      break;

    case 'action_body':
      // Check if it's over-narrated for essay types that need evidence
      const needsEvidence = ['why_us', 'why_major', 'extracurricular', 'leadership'].includes(essayType);
      if (needsEvidence && strengthTypes.has('storytelling') && !strengthTypes.has('evidence')) {
        gaps.push({
          type: 'over_narrated',
          severity: 'major',
          description: 'Heavy on narrative but missing evidence of impact',
          location: 'throughout',
        });
      }
      break;

    case 'opening_hook':
    case 'closing_synthesis':
      if (!strengthTypes.has('voice')) {
        gaps.push({
          type: 'missing_voice',
          severity: 'minor',
          description: 'Could use more distinctive personal voice',
          location: 'throughout',
        });
      }
      break;
  }

  return gaps;
}

// ============================================================================
// MAIN DETECTION CLASS
// ============================================================================

export class EssayElementDetector {
  /**
   * Detect the primary element type for a given passage
   */
  detectElement(
    passage: string,
    essayType: SupplementalType,
    context: {
      fullEssay: string;
      passagePosition: 'start' | 'early' | 'middle' | 'late' | 'end';
    }
  ): ElementAnalysis {
    const allElements: EssayElement[] = [
      'opening_hook',
      'context_setup',
      'action_body',
      'evidence_section',
      'reflection_moment',
      'insight_revelation',
      'connection_bridge',
      'closing_synthesis',
      'transition',
    ];

    // Score each element type
    const scores = allElements.map(element => ({
      element,
      ...scoreElementMatch(passage, element, context.passagePosition),
    }));

    // Sort by score
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];

    // Calculate character positions
    const startIndex = context.fullEssay.indexOf(passage);
    const sentences = splitIntoSentences(context.fullEssay);
    const passageSentences = splitIntoSentences(passage);

    let sentenceStart = 0;
    let charCount = 0;
    for (let i = 0; i < sentences.length; i++) {
      if (charCount >= startIndex) {
        sentenceStart = i;
        break;
      }
      charCount += sentences[i].length + 1;
    }

    const strengths = detectStrengths(passage);
    const gaps = detectGaps(passage, best.element, strengths, essayType);

    return {
      element: best.element,
      position: {
        start: startIndex,
        end: startIndex + passage.length,
        sentenceStart,
        sentenceEnd: sentenceStart + passageSentences.length - 1,
      },
      confidence: best.score,
      signals: best.signals,
      currentStrengths: strengths,
      gaps,
    };
  }

  /**
   * Analyze the full structure of an essay
   */
  analyzeFullStructure(
    essay: string,
    essayType: SupplementalType
  ): FullEssayStructure {
    const sentences = splitIntoSentences(essay);
    const elements: ElementAnalysis[] = [];

    // Analyze in chunks (roughly paragraph-sized)
    const chunkSize = Math.max(2, Math.floor(sentences.length / 5));

    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize).join(' ');
      const position = getPositionCategory(i, sentences.length);

      const analysis = this.detectElement(chunk, essayType, {
        fullEssay: essay,
        passagePosition: position,
      });

      elements.push(analysis);
    }

    // Calculate overall pattern
    const overallPattern = this.determineOverallPattern(elements, essayType);

    // Calculate balance
    const balanceAnalysis = this.calculateBalance(elements, essayType);

    // Generate structure recommendations
    const recommendations = this.generateStructureRecommendations(
      elements,
      balanceAnalysis,
      essayType
    );

    return {
      elements,
      overallPattern,
      balanceAnalysis,
      recommendations,
    };
  }

  /**
   * Determine the overall structural pattern of the essay
   */
  private determineOverallPattern(
    elements: ElementAnalysis[],
    essayType: SupplementalType
  ): EssayStructurePattern {
    const elementCounts: Record<EssayElement, number> = {
      opening_hook: 0,
      context_setup: 0,
      action_body: 0,
      evidence_section: 0,
      reflection_moment: 0,
      insight_revelation: 0,
      connection_bridge: 0,
      closing_synthesis: 0,
      transition: 0,
    };

    elements.forEach(e => {
      elementCounts[e.element]++;
    });

    const total = elements.length;
    const narrativePercent = (elementCounts.action_body + elementCounts.context_setup) / total;
    const reflectionPercent = (elementCounts.reflection_moment + elementCounts.insight_revelation) / total;
    const evidencePercent = elementCounts.evidence_section / total;

    // Check for specific patterns
    if (narrativePercent > 0.6) return 'narrative_heavy';
    if (reflectionPercent > 0.5) return 'reflection_heavy';
    if (evidencePercent > 0.4) return 'evidence_heavy';

    // Check for front/back loading
    const firstHalf = elements.slice(0, Math.floor(elements.length / 2));
    const secondHalf = elements.slice(Math.floor(elements.length / 2));

    const firstHalfStrength = firstHalf.reduce((acc, e) => acc + e.currentStrengths.length, 0);
    const secondHalfStrength = secondHalf.reduce((acc, e) => acc + e.currentStrengths.length, 0);

    if (firstHalfStrength > secondHalfStrength * 1.5) return 'front_loaded';
    if (secondHalfStrength > firstHalfStrength * 1.5) return 'back_loaded';

    // Check for fragmentation (many transitions, no clear structure)
    if (elementCounts.transition > total * 0.3) return 'fragmented';

    return 'balanced';
  }

  /**
   * Calculate the balance of different approaches in the essay
   */
  private calculateBalance(
    elements: ElementAnalysis[],
    essayType: SupplementalType
  ): BalanceAnalysis {
    let storytelling = 0;
    let reflection = 0;
    let evidence = 0;
    let connection = 0;

    elements.forEach(e => {
      e.currentStrengths.forEach(s => {
        switch (s.type) {
          case 'storytelling': storytelling++; break;
          case 'reflection': reflection++; break;
          case 'evidence': evidence++; break;
          case 'connection': connection++; break;
        }
      });

      // Also count by element type
      if (['action_body', 'context_setup'].includes(e.element)) storytelling += 0.5;
      if (['reflection_moment', 'insight_revelation'].includes(e.element)) reflection += 0.5;
      if (e.element === 'evidence_section') evidence += 0.5;
      if (e.element === 'connection_bridge') connection += 0.5;
    });

    const total = storytelling + reflection + evidence + connection || 1;

    const actual = {
      storytelling: Math.round((storytelling / total) * 100),
      reflection: Math.round((reflection / total) * 100),
      evidence: Math.round((evidence / total) * 100),
      connection: Math.round((connection / total) * 100),
    };

    const ideal = IDEAL_BALANCE_BY_TYPE[essayType];

    const imbalanceAreas: string[] = [];
    if (Math.abs(actual.storytelling - ideal.storytelling) > 15) {
      imbalanceAreas.push(actual.storytelling > ideal.storytelling ? 'over-storytelling' : 'under-storytelling');
    }
    if (Math.abs(actual.reflection - ideal.reflection) > 15) {
      imbalanceAreas.push(actual.reflection > ideal.reflection ? 'over-reflection' : 'under-reflection');
    }
    if (Math.abs(actual.evidence - ideal.evidence) > 15) {
      imbalanceAreas.push(actual.evidence > ideal.evidence ? 'over-evidence' : 'under-evidence');
    }
    if (Math.abs(actual.connection - ideal.connection) > 15) {
      imbalanceAreas.push(actual.connection > ideal.connection ? 'over-connection' : 'under-connection');
    }

    return {
      storytellingPercent: actual.storytelling,
      reflectionPercent: actual.reflection,
      evidencePercent: actual.evidence,
      connectionPercent: actual.connection,
      idealBalance: ideal,
      imbalanceAreas,
    };
  }

  /**
   * Generate recommendations for improving essay structure
   */
  private generateStructureRecommendations(
    elements: ElementAnalysis[],
    balance: BalanceAnalysis,
    essayType: SupplementalType
  ): StructureRecommendation[] {
    const recommendations: StructureRecommendation[] = [];
    const ideal = IDEAL_BALANCE_BY_TYPE[essayType];

    // Check for over-storytelling
    if (balance.imbalanceAreas.includes('over-storytelling')) {
      // Find an action_body element to convert
      const narrativeElement = elements.find(e => e.element === 'action_body');
      if (narrativeElement) {
        recommendations.push({
          element: 'action_body',
          currentApproach: 'narrative-heavy',
          recommendedApproach: balance.evidencePercent < ideal.evidence
            ? 'evidence-based'
            : 'reflection-focused',
          rationale: `${essayType} essays benefit from ${
            balance.evidencePercent < ideal.evidence
              ? 'concrete evidence and metrics'
              : 'deeper reflection and insight'
          } rather than extended narrative`,
          priority: 'high',
        });
      }
    }

    // Check for under-reflection
    if (balance.imbalanceAreas.includes('under-reflection')) {
      recommendations.push({
        element: 'reflection_moment',
        currentApproach: 'surface-level',
        recommendedApproach: 'depth-focused',
        rationale: `Add a section that explores the deeper meaning or unique insight from your experience`,
        priority: 'high',
      });
    }

    // Check for under-evidence
    if (balance.imbalanceAreas.includes('under-evidence') &&
        ['why_us', 'why_major', 'extracurricular', 'leadership'].includes(essayType)) {
      recommendations.push({
        element: 'evidence_section',
        currentApproach: 'missing',
        recommendedApproach: 'metrics-driven',
        rationale: `Add quantifiable outcomes or specific achievements to strengthen credibility`,
        priority: 'high',
      });
    }

    // Check for weak connection in why_us/why_major
    if (balance.imbalanceAreas.includes('under-connection') &&
        ['why_us', 'why_major', 'future_goals'].includes(essayType)) {
      recommendations.push({
        element: 'connection_bridge',
        currentApproach: 'generic',
        recommendedApproach: 'specific-fit',
        rationale: `Strengthen the connection to ${
          essayType === 'why_us' ? 'specific school resources, professors, or programs' :
          essayType === 'why_major' ? 'specific aspects of the field and how you engage with them' :
          'your future goals with concrete steps'
        }`,
        priority: 'critical',
      });
    }

    // Check for gaps in individual elements
    elements.forEach(e => {
      e.gaps.forEach(gap => {
        if (gap.severity === 'critical' && !recommendations.find(r => r.element === e.element)) {
          recommendations.push({
            element: e.element,
            currentApproach: 'has-gap',
            recommendedApproach: getApproachForGap(gap.type),
            rationale: gap.description,
            priority: 'high',
          });
        }
      });
    });

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    recommendations.sort((a, b) => {
      const aOrder = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const bOrder = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
      return aOrder - bOrder;
    });

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }
}

/**
 * Get recommended approach for a specific gap type
 */
function getApproachForGap(gapType: ElementGap['type']): string {
  switch (gapType) {
    case 'missing_evidence': return 'evidence-based with metrics';
    case 'shallow_reflection': return 'depth-focused reflection';
    case 'generic_insight': return 'unique-perspective insight';
    case 'weak_connection': return 'specific-fit connection';
    case 'over_narrated': return 'balanced narrative + evidence';
    case 'missing_voice': return 'authentic voice enhancement';
    default: return 'strengthened';
  }
}

// Export singleton instance
export const essayElementDetector = new EssayElementDetector();
