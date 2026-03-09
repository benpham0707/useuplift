/**
 * Competitive Intelligence Service
 *
 * Pure deterministic analysis (<5ms, NO LLM calls).
 * Detects overused phrases and structural fatigue patterns in college application essays.
 */

import { OVERUSED_PHRASE_DATABASE } from './overusedPhraseDatabase';
import type {
  CompetitiveAnalysisInput,
  CompetitiveAnalysis,
  OverusedPhraseMatch,
  FatiguePattern,
  DistinctiveElement,
} from './types';

/**
 * Pre-compiled regex patterns for phrase detection.
 * Built once at module load time for fast repeated matching.
 */
const PHRASE_PATTERNS: Array<{
  regex: RegExp;
  entry: (typeof OVERUSED_PHRASE_DATABASE)[number];
}> = OVERUSED_PHRASE_DATABASE.map((entry) => ({
  regex: new RegExp(
    `\\b${escapeRegex(entry.phrase)}\\b`,
    'gi'
  ),
  entry,
}));

/** Escape special regex characters in phrase strings */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class CompetitiveIntelligenceService {
  /**
   * Analyze text for overused phrases and structural fatigue patterns.
   * Pure deterministic — no LLM calls, executes in <5ms.
   */
  analyze(input: CompetitiveAnalysisInput): CompetitiveAnalysis {
    const { text, essayType } = input;
    const lowerText = text.toLowerCase();

    // Phase 1: Overused phrase detection
    const overusedPhrases = this.detectOverusedPhrases(text, lowerText, essayType);

    // Phase 2: Fatigue pattern detection
    const fatiguePatterns = this.detectFatiguePatterns(text, lowerText);

    // Phase 3: Detect positive distinctiveness signals
    const distinctiveElements = this.detectDistinctiveElements(text, lowerText);

    // Phase 4: Calculate distinctiveness score (penalties + bonuses)
    const distinctivenessScore = this.calculateDistinctiveness(
      overusedPhrases,
      fatiguePatterns,
      distinctiveElements
    );

    // Build summary
    const summary = this.buildSummary(
      overusedPhrases,
      fatiguePatterns,
      distinctivenessScore,
      distinctiveElements
    );

    return {
      overusedPhrases,
      fatiguePatterns,
      distinctiveElements,
      distinctivenessScore,
      clicheCount: overusedPhrases.length,
      summary,
    };
  }

  /**
   * Scan text for overused phrases using pre-compiled regex patterns.
   * Case-insensitive, word-boundary matching.
   */
  private detectOverusedPhrases(
    text: string,
    _lowerText: string,
    essayType?: string
  ): OverusedPhraseMatch[] {
    const matches: OverusedPhraseMatch[] = [];

    for (const { regex, entry } of PHRASE_PATTERNS) {
      // Reset lastIndex for global regex
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        // Boost fatigue level if the phrase is especially problematic for this essay type
        const isTypeRelevant = essayType
          ? entry.essayTypes.includes(essayType)
          : false;

        matches.push({
          phrase: match[0],
          position: match.index,
          category: entry.category,
          frequency: entry.frequency,
          aoFatigueLevel: isTypeRelevant && entry.aoFatigueLevel === 'high'
            ? 'extreme'
            : entry.aoFatigueLevel,
          betterAlternative: entry.betterAlternative,
          whyAOsNotice: entry.whyAOsNotice,
        });
      }
    }

    // Sort by position for reading order
    matches.sort((a, b) => a.position - b.position);

    return matches;
  }

  /**
   * Detect structural fatigue patterns via heuristic analysis.
   */
  private detectFatiguePatterns(
    text: string,
    lowerText: string
  ): FatiguePattern[] {
    const patterns: FatiguePattern[] = [];
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);

    // Pattern 1: Chronological autobiography
    // Detect time-ordered life events: "when I was X", "at age X", "in Xth grade"
    const timeMarkers = [
      /\bwhen i was (?:\w+ )?(?:years? old|young|little|a (?:child|kid|baby|toddler))/gi,
      /\bat (?:age|the age of) \d+/gi,
      /\bin (?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|\d+(?:st|nd|rd|th)) grade/gi,
      /\b(?:as a|when i (?:was|became|started|entered)) (?:freshman|sophomore|junior|senior)/gi,
      /\bgrowing up/gi,
      /\bfrom a young age/gi,
      /\bas i (?:grew|got) older/gi,
    ];
    let timeMarkerCount = 0;
    for (const marker of timeMarkers) {
      marker.lastIndex = 0;
      const markerMatches = lowerText.match(marker);
      if (markerMatches) timeMarkerCount += markerMatches.length;
    }
    if (timeMarkerCount >= 3) {
      patterns.push({
        name: 'Chronological Autobiography',
        description: `Found ${timeMarkerCount} time-ordered life markers. The essay reads like a timeline rather than a focused narrative.`,
        position: 0,
        severity: timeMarkerCount >= 5 ? 'high' : 'medium',
        suggestion: 'Focus on one moment or theme in depth rather than surveying your life chronologically. A single vivid scene reveals more than a timeline.',
      });
    }

    // Pattern 2: Generic opener + body + tidy conclusion
    // Detect if first paragraph has a common opener AND last paragraph has a common closer
    if (paragraphs.length >= 3) {
      const firstPara = paragraphs[0].toLowerCase();
      const lastPara = paragraphs[paragraphs.length - 1].toLowerCase();

      const genericOpeners = [
        'ever since', 'i have always', 'growing up', 'from a young age',
        'my journey', 'when i was', 'i remember', 'it all started',
      ];
      const genericClosers = [
        'this experience taught me', 'i learned that', 'looking back',
        'i now know', 'i am who i am', 'i grew as', 'in conclusion',
        'this is why i want', 'i am excited to',
      ];

      const hasGenericOpener = genericOpeners.some((o) => firstPara.includes(o));
      const hasGenericCloser = genericClosers.some((c) => lastPara.includes(c));

      if (hasGenericOpener && hasGenericCloser) {
        patterns.push({
          name: 'Template Essay Structure',
          description: 'Generic opener paired with a formulaic conclusion. This is the most common essay template AOs see.',
          position: 0,
          severity: 'high',
          suggestion: 'Revise both your opening and closing. Open with a specific scene or detail. Close with an image, a question, or a forward action — not a lesson summary.',
        });
      }
    }

    // Pattern 3: Hero's journey with neat resolution
    // Detect: challenge/struggle → turning point → resolution/growth
    const challengeSignals = [
      'struggled', 'challenge', 'obstacle', 'difficult', 'hardest',
      'adversity', 'rock bottom', 'fell apart', 'lost', 'failed',
    ];
    const turningPointSignals = [
      'turning point', 'everything changed', 'then it hit me',
      'realized', 'that moment', 'decided to',
    ];
    const resolutionSignals = [
      'overcame', 'stronger', 'taught me', 'i learned', 'i grew',
      'i am now', 'better person', 'new perspective',
    ];

    const hasChallengeFirst = challengeSignals.some((s) => {
      const idx = lowerText.indexOf(s);
      return idx >= 0 && idx < lowerText.length * 0.5;
    });
    const hasTurningMid = turningPointSignals.some((s) => {
      const idx = lowerText.indexOf(s);
      return idx >= lowerText.length * 0.3 && idx <= lowerText.length * 0.8;
    });
    const hasResolutionEnd = resolutionSignals.some((s) => {
      const idx = lowerText.indexOf(s);
      return idx >= lowerText.length * 0.6;
    });

    if (hasChallengeFirst && hasTurningMid && hasResolutionEnd) {
      patterns.push({
        name: 'Hero\'s Journey with Neat Resolution',
        description: 'Challenge → epiphany → growth arc. While valid, this is the most common essay structure. AOs can predict the ending from the first paragraph.',
        position: 0,
        severity: 'medium',
        suggestion: 'Consider breaking the template: start with the resolution and work backward, or end with an unresolved question. Real growth is rarely this tidy.',
      });
    }

    // Pattern 4: List of activities disguised as essay
    // Detect if the essay mentions many distinct activities/accomplishments
    const activitySignals = [
      /\b(?:president|captain|founder|leader|editor|chair) of\b/gi,
      /\b(?:volunteered|interned|worked) (?:at|with|for)\b/gi,
      /\b(?:won|received|earned|awarded) (?:a |the |an )?\w+ (?:award|prize|scholarship|medal|trophy)\b/gi,
      /\bparticipated in\b/gi,
      /\bmember of\b/gi,
      /\b(?:club|team|organization|committee|board)\b/gi,
    ];
    let activityMentions = 0;
    for (const signal of activitySignals) {
      signal.lastIndex = 0;
      const signalMatches = lowerText.match(signal);
      if (signalMatches) activityMentions += signalMatches.length;
    }
    if (activityMentions >= 5) {
      patterns.push({
        name: 'Activity List Disguised as Essay',
        description: `Found ${activityMentions} activity/achievement mentions. The essay reads more like a resume than a personal narrative.`,
        position: 0,
        severity: activityMentions >= 8 ? 'high' : 'medium',
        suggestion: 'Pick ONE activity or experience and go deep. The activities section already lists your resume — the essay should reveal who you are behind the activities.',
      });
    }

    // Pattern 5: Excessive sentence-starting with "I"
    const iStartCount = sentences.filter((s) => {
      const trimmed = s.trim();
      return trimmed.startsWith('I ') || trimmed.startsWith('I\'');
    }).length;
    const iStartRatio = sentences.length > 0 ? iStartCount / sentences.length : 0;
    if (iStartRatio > 0.5 && sentences.length >= 6) {
      patterns.push({
        name: 'Excessive "I" Sentence Starts',
        description: `${Math.round(iStartRatio * 100)}% of sentences begin with "I". This creates monotonous rhythm and signals self-centered writing.`,
        position: 0,
        severity: iStartRatio > 0.7 ? 'high' : 'medium',
        suggestion: 'Vary your sentence openings. Start with setting, action, dialogue, or observation. Let your voice emerge through perspective, not pronoun dominance.',
      });
    }

    // Pattern 6: Quote opener
    // Opening with a famous quote is one of the most tired essay strategies
    if (paragraphs.length > 0) {
      const firstPara = paragraphs[0].trim();
      const quoteOpenerRegex = /^[""\u201C](?:[^"""\u201D]{10,100})[""\u201D]\s*[-—–]\s*\w/;
      const genericQuoteStart = /^(?:as .+ (?:once )?said|.+ once (?:said|wrote|observed))/i;
      if (quoteOpenerRegex.test(firstPara) || genericQuoteStart.test(firstPara)) {
        patterns.push({
          name: 'Famous Quote Opener',
          description: 'Opening with a famous quote. AOs see this in ~15% of essays — it signals the student couldn\'t think of their own hook.',
          position: 0,
          severity: 'high',
          suggestion: 'Delete the quote entirely. Open with YOUR moment, YOUR detail, YOUR voice. The essay is about you, not about what someone famous said.',
        });
      }
    }

    // Pattern 7: Dictionary definition opener
    if (paragraphs.length > 0) {
      const firstPara = paragraphs[0].toLowerCase();
      const dictPatterns = [
        'merriam-webster defines', 'according to the dictionary',
        'the definition of', 'is defined as', 'webster\'s defines',
        'oxford defines', 'the dictionary defines',
      ];
      if (dictPatterns.some(p => firstPara.includes(p))) {
        patterns.push({
          name: 'Dictionary Definition Opener',
          description: 'Opening with a dictionary definition. This is universally cited by AOs as the #1 essay opener to avoid.',
          position: 0,
          severity: 'high',
          suggestion: 'Delete the definition. Show the concept through a lived experience. If you need to define something, weave it into the narrative naturally.',
        });
      }
    }

    // Pattern 8: Mission trip / voluntourism narrative
    const missionTripSignals = [
      'less fortunate', 'third world', 'underprivileged',
      'opened my eyes', 'how lucky i am', 'take for granted',
      'changed my perspective', 'grateful for what i have',
    ];
    const missionTripCount = missionTripSignals.filter(s => lowerText.includes(s)).length;
    if (missionTripCount >= 3) {
      patterns.push({
        name: 'Voluntourism Narrative',
        description: `Found ${missionTripCount} voluntourism signals. This pattern — privileged student discovers gratitude through brief service — is one AOs are actively trained to critique.`,
        position: 0,
        severity: 'high',
        suggestion: 'Shift focus from what you received to what you contributed. Center the people you worked with as full humans, not props for your personal growth. Better: focus on a specific systemic problem you noticed and what you did about it.',
      });
    }

    // Pattern 9: Gratitude list / "I'm so blessed"
    const gratitudeSignals = [
      'i am grateful', 'i\'m grateful', 'thankful for',
      'blessed to', 'fortunate to', 'lucky to have',
      'appreciate everything', 'grateful for my',
    ];
    const gratitudeCount = gratitudeSignals.filter(s => lowerText.includes(s)).length;
    if (gratitudeCount >= 3) {
      patterns.push({
        name: 'Gratitude List',
        description: `Found ${gratitudeCount} gratitude expressions. While genuine, gratitude-heavy essays lack the tension, specificity, and self-revelation AOs look for.`,
        position: 0,
        severity: 'medium',
        suggestion: 'Convert gratitude into action. Instead of "I\'m grateful for my parents\' sacrifice," show what you DID with the opportunity. Gratitude is the starting point, not the essay.',
      });
    }

    // Pattern 10: Generic diversity/identity essay
    const diversityGenericSignals = [
      'between two cultures', 'bridge between', 'torn between',
      'best of both worlds', 'neither here nor there',
      'didn\'t fit in', 'felt like an outsider',
      'straddling two worlds', 'multicultural identity',
    ];
    const diversityGenericCount = diversityGenericSignals.filter(s => lowerText.includes(s)).length;
    if (diversityGenericCount >= 3) {
      patterns.push({
        name: 'Generic Identity Essay',
        description: `Found ${diversityGenericCount} generic diversity/identity phrases. AOs read hundreds of "between two cultures" essays — yours needs specificity to stand out.`,
        position: 0,
        severity: 'medium',
        suggestion: 'Replace abstractions with ONE specific moment where your identity created tension or insight. "Between two cultures" is a concept; "my grandmother\'s face when I ordered in English at her favorite restaurant" is a scene.',
      });
    }

    return patterns;
  }

  /**
   * Detect positive distinctiveness signals — elements that make the essay stand out.
   * Pure deterministic, <2ms.
   */
  private detectDistinctiveElements(text: string, lowerText: string): DistinctiveElement[] {
    const elements: DistinctiveElement[] = [];

    // 1. Specific details: numbers, proper nouns, named places/people
    const specificNumberRegex = /\b\d{1,3}(?:,\d{3})*\b(?!\s*(?:am|pm|years? old|grade))/g;
    let numMatch;
    let specificCount = 0;
    while ((numMatch = specificNumberRegex.exec(text)) !== null && specificCount < 3) {
      elements.push({
        type: 'specific_detail',
        description: `Specific number used: "${text.slice(Math.max(0, numMatch.index - 15), numMatch.index + numMatch[0].length + 15).trim()}"`,
        position: numMatch.index,
      });
      specificCount++;
    }

    // 2. Dialogue presence (actual quoted speech)
    const dialogueRegex = /[""\u201C][^"""\u201D]{5,80}[""\u201D]\s*(?:I said|she said|he said|they said|my \w+ said|said my|I asked|she asked|he asked|whispered|shouted|replied|muttered)/gi;
    let dlgMatch;
    while ((dlgMatch = dialogueRegex.exec(text)) !== null) {
      elements.push({
        type: 'dialogue',
        description: 'Real dialogue with attribution — brings scenes alive',
        position: dlgMatch.index,
      });
    }
    // Also check for standalone dialogue (quotes without "said")
    const standaloneDialogue = /[""\u201C][^"""\u201D]{10,100}[.!?][""\u201D]/g;
    let sdMatch;
    let sdCount = 0;
    while ((sdMatch = standaloneDialogue.exec(text)) !== null && sdCount < 2) {
      // Only count if not already matched by the attributed dialogue pattern
      const alreadyFound = elements.some(e => e.type === 'dialogue' && Math.abs(e.position - sdMatch!.index) < 20);
      if (!alreadyFound) {
        elements.push({
          type: 'dialogue',
          description: 'Quoted speech adds scene immersion',
          position: sdMatch.index,
        });
        sdCount++;
      }
    }

    // 3. Sensory language (sight, sound, smell, taste, touch)
    const sensoryPatterns = [
      /\b(?:tasted|smelled|the smell of|the taste of|the sound of|heard|echoed|hummed|whispered|crisp|pungent|acrid)\b/gi,
      /\b(?:the warmth|the cold|the weight|texture|rough|smooth|sharp)\b/gi,
    ];
    let sensoryCount = 0;
    for (const pattern of sensoryPatterns) {
      pattern.lastIndex = 0;
      let sMatch;
      while ((sMatch = pattern.exec(lowerText)) !== null && sensoryCount < 3) {
        elements.push({
          type: 'sensory_language',
          description: `Sensory detail: "${text.slice(sMatch.index, sMatch.index + sMatch[0].length)}"`,
          position: sMatch.index,
        });
        sensoryCount++;
      }
    }

    // 4. Unusual structure: essay starts with dialogue, a question, or in medias res
    const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? '';
    if (/^[""\u201C]/.test(firstSentence)) {
      elements.push({
        type: 'unusual_structure',
        description: 'Opens with dialogue — immediately immersive',
        position: 0,
      });
    } else if (firstSentence.endsWith('?') || /\?$/.test(firstSentence)) {
      elements.push({
        type: 'unusual_structure',
        description: 'Opens with a question — creates immediate engagement',
        position: 0,
      });
    }

    // 5. Counter-narrative: going against expected direction
    const counterSignals = [
      'but i didn\'t', 'but that\'s not', 'except it wasn\'t',
      'the truth is', 'what i didn\'t expect', 'contrary to',
      'instead of celebrating', 'i should have been happy',
    ];
    for (const signal of counterSignals) {
      const idx = lowerText.indexOf(signal);
      if (idx >= 0) {
        elements.push({
          type: 'counter_narrative',
          description: 'Counter-narrative subverts reader expectations — creates authentic tension',
          position: idx,
        });
        break; // One is enough
      }
    }

    return elements;
  }

  /**
   * Calculate distinctiveness score (0-100) based on cliche density, patterns, and positive signals.
   */
  private calculateDistinctiveness(
    phrases: OverusedPhraseMatch[],
    patterns: FatiguePattern[],
    distinctiveElements: DistinctiveElement[]
  ): number {
    let score = 70; // Start at 70 (neutral baseline), not 100

    // Penalty per overused phrase based on its frequency level
    for (const phrase of phrases) {
      if (phrase.frequency >= 8) {
        score -= 8; // Very common phrases
      } else if (phrase.frequency >= 6) {
        score -= 5; // Common phrases
      } else if (phrase.frequency >= 4) {
        score -= 3; // Moderately common phrases
      } else {
        score -= 2; // Less common but still tracked
      }
    }

    // Penalty per fatigue pattern
    for (const pattern of patterns) {
      switch (pattern.severity) {
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }

    // Bonus per distinctive element (positive signals push score UP)
    const bonusPerType: Record<DistinctiveElement['type'], number> = {
      specific_detail: 3,
      dialogue: 5,
      unusual_structure: 6,
      sensory_language: 3,
      unique_metaphor: 5,
      counter_narrative: 5,
    };
    for (const element of distinctiveElements) {
      score += bonusPerType[element.type] ?? 2;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Build a human-readable summary of the analysis.
   */
  private buildSummary(
    phrases: OverusedPhraseMatch[],
    patterns: FatiguePattern[],
    distinctivenessScore: number,
    distinctiveElements: DistinctiveElement[]
  ): string {
    const parts: string[] = [];

    parts.push(`Distinctiveness score: ${distinctivenessScore}/100.`);

    if (phrases.length === 0) {
      parts.push('No overused phrases detected — excellent originality.');
    } else {
      const extremeCount = phrases.filter((p) => p.aoFatigueLevel === 'extreme').length;
      const highCount = phrases.filter((p) => p.aoFatigueLevel === 'high').length;

      parts.push(`Found ${phrases.length} overused phrase(s).`);
      if (extremeCount > 0) {
        parts.push(
          `${extremeCount} phrase(s) cause EXTREME AO fatigue and should be revised immediately.`
        );
      }
      if (highCount > 0) {
        parts.push(`${highCount} phrase(s) cause HIGH AO fatigue.`);
      }
    }

    if (patterns.length > 0) {
      const patternNames = patterns.map((p) => p.name).join(', ');
      parts.push(`Structural fatigue patterns detected: ${patternNames}.`);
    }

    // Highlight positive signals
    if (distinctiveElements.length > 0) {
      const typeLabels: Record<string, string> = {
        specific_detail: 'specific details',
        dialogue: 'real dialogue',
        unusual_structure: 'distinctive structure',
        sensory_language: 'sensory language',
        unique_metaphor: 'original metaphor',
        counter_narrative: 'counter-narrative tension',
      };
      const uniqueTypes = [...new Set(distinctiveElements.map(e => typeLabels[e.type] ?? e.type))];
      parts.push(`Strengths: ${uniqueTypes.join(', ')}.`);
    }

    if (distinctivenessScore >= 80) {
      parts.push('This essay has strong original voice.');
    } else if (distinctivenessScore >= 50) {
      parts.push('This essay has moderate originality but would benefit from revision to eliminate common patterns.');
    } else {
      parts.push('This essay relies heavily on common phrases and templates. Significant revision recommended.');
    }

    return parts.join(' ');
  }
}

export const competitiveIntelligenceService = new CompetitiveIntelligenceService();
