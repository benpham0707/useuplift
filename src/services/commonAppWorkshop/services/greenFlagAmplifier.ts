/**
 * Green Flag Amplifier Service
 *
 * Detects strengths in essay text that the college specifically values
 * by pattern matching against college-specific green flag definitions.
 *
 * Key Features:
 * - Pattern matching using signalPhrases and regex patterns
 * - Returns enhancement guidance to amplify strengths
 * - Provides preservation directives for suggestion generation
 * - Prioritizes by strength (exceptional > strong > positive)
 *
 * Integration: Inject output into TypeSpecificSuggestionService prompts
 * to ensure suggestions preserve and amplify college-valued strengths.
 */

import { getCollegeResearch } from '../data';
import type { CollegeGreenFlag } from '../types/collegeResearch';

// ============================================================================
// TYPES
// ============================================================================

export interface GreenFlagAmplifierInput {
  essayText: string;
  collegeId: string;
  promptId?: string; // Optional - if provided, only check flags applicable to this prompt
}

export interface GreenFlagMatch {
  flagId: string;
  flagName: string;
  strength: 'exceptional' | 'strong' | 'positive';
  matchedPhrase: string;
  matchLocation: number;
  teaching: {
    whatWorks: string;
    whyItMatters: string;
    howToEnhance: string;
  };
  evidence: {
    source: string;
    quote: string;
    explanation: string;
  };
  scoreImpact: {
    dimension: string;
    bonus: string;
  };
}

export interface GreenFlagAmplifierOutput {
  matches: GreenFlagMatch[];
  exceptionalCount: number;
  strongCount: number;
  positiveCount: number;
  formattedForPrompt: string;
  preservationDirectives: string[];
}

// ============================================================================
// GREEN FLAG AMPLIFIER SERVICE
// ============================================================================

export class GreenFlagAmplifier {
  /**
   * Match green flags against essay text
   */
  matchFlags(input: GreenFlagAmplifierInput): GreenFlagAmplifierOutput {
    const college = getCollegeResearch(input.collegeId);
    if (!college) {
      return {
        matches: [],
        exceptionalCount: 0,
        strongCount: 0,
        positiveCount: 0,
        formattedForPrompt: '',
        preservationDirectives: [],
      };
    }

    const matches: GreenFlagMatch[] = [];
    const matchedFlagIds = new Set<string>();

    for (const flag of college.greenFlags) {
      // Skip if we already matched this flag
      if (matchedFlagIds.has(flag.flagId)) continue;

      // Skip if flag doesn't apply to this prompt (when promptId specified)
      if (
        input.promptId &&
        flag.applicablePrompts.length > 0 &&
        !flag.applicablePrompts.includes(input.promptId)
      ) {
        continue;
      }

      // Try signal phrase matching first
      const phraseMatch = this.matchSignalPhrases(input.essayText, flag);
      if (phraseMatch) {
        matches.push(this.createMatch(flag, phraseMatch.phrase, phraseMatch.index));
        matchedFlagIds.add(flag.flagId);
        continue;
      }

      // Try regex patterns if no phrase matched
      const patternMatch = this.matchPatterns(input.essayText, flag);
      if (patternMatch) {
        matches.push(this.createMatch(flag, patternMatch.phrase, patternMatch.index));
        matchedFlagIds.add(flag.flagId);
      }
    }

    // Sort by strength (exceptional first)
    const sortedMatches = this.sortByStrength(matches);

    // Generate preservation directives
    const preservationDirectives = this.generatePreservationDirectives(sortedMatches);

    return {
      matches: sortedMatches,
      exceptionalCount: sortedMatches.filter((m) => m.strength === 'exceptional').length,
      strongCount: sortedMatches.filter((m) => m.strength === 'strong').length,
      positiveCount: sortedMatches.filter((m) => m.strength === 'positive').length,
      formattedForPrompt: this.formatForPrompt(sortedMatches, input.collegeId),
      preservationDirectives,
    };
  }

  /**
   * Match using signal phrases (case-insensitive substring matching)
   */
  private matchSignalPhrases(
    text: string,
    flag: CollegeGreenFlag
  ): { phrase: string; index: number } | null {
    const lowerText = text.toLowerCase();

    for (const phrase of flag.detection.signalPhrases || []) {
      const lowerPhrase = phrase.toLowerCase();
      const index = lowerText.indexOf(lowerPhrase);

      if (index !== -1) {
        // Extract the actual phrase from original text (preserving case)
        const actualPhrase = text.substring(index, index + phrase.length);
        return { phrase: actualPhrase, index };
      }
    }

    return null;
  }

  /**
   * Match using regex patterns
   */
  private matchPatterns(
    text: string,
    flag: CollegeGreenFlag
  ): { phrase: string; index: number } | null {
    for (const pattern of flag.detection.patterns || []) {
      try {
        const regex = new RegExp(pattern, 'gi');
        const match = regex.exec(text);

        if (match) {
          return { phrase: match[0], index: match.index };
        }
      } catch {
        // Invalid regex, skip
        console.warn(`[GreenFlagAmplifier] Invalid regex pattern: ${pattern}`);
      }
    }

    return null;
  }

  /**
   * Create a GreenFlagMatch from a flag definition and match data
   */
  private createMatch(
    flag: CollegeGreenFlag,
    matchedPhrase: string,
    matchLocation: number
  ): GreenFlagMatch {
    return {
      flagId: flag.flagId,
      flagName: flag.flagName,
      strength: flag.strength,
      matchedPhrase: this.extractContext(matchedPhrase),
      matchLocation,
      teaching: {
        whatWorks: flag.teaching.whatWorks,
        whyItMatters: flag.teaching.whyItMatters,
        howToEnhance: flag.teaching.howToEnhance,
      },
      evidence: {
        source: flag.evidence.source,
        quote: flag.evidence.quote,
        explanation: flag.evidence.explanation,
      },
      scoreImpact: {
        dimension: flag.scoreImpact.dimension,
        bonus: flag.scoreImpact.bonus,
      },
    };
  }

  /**
   * Extract context around a match
   */
  private extractContext(text: string): string {
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  }

  /**
   * Sort matches by strength (exceptional > strong > positive)
   */
  private sortByStrength(matches: GreenFlagMatch[]): GreenFlagMatch[] {
    const strengthOrder: Record<string, number> = {
      exceptional: 0,
      strong: 1,
      positive: 2,
    };

    return [...matches].sort((a, b) => strengthOrder[a.strength] - strengthOrder[b.strength]);
  }

  /**
   * Generate preservation directives for each green flag
   */
  private generatePreservationDirectives(matches: GreenFlagMatch[]): string[] {
    return matches.map((m) => {
      const priority =
        m.strength === 'exceptional' ? 'CRITICAL' : m.strength === 'strong' ? 'IMPORTANT' : 'PRESERVE';

      return `[${priority}] Preserve "${m.matchedPhrase.substring(0, 40)}..." - demonstrates ${m.flagName}`;
    });
  }

  /**
   * Format matches for injection into suggestion prompt
   */
  formatForPrompt(matches: GreenFlagMatch[], collegeId?: string): string {
    if (matches.length === 0) {
      return '';
    }

    const collegeName = collegeId
      ? getCollegeResearch(collegeId)?.collegeName || collegeId.toUpperCase()
      : 'THIS COLLEGE';

    let output = `
═══════════════════════════════════════════════════════════
DETECTED GREEN FLAGS (PRESERVE AND AMPLIFY)
═══════════════════════════════════════════════════════════

${matches.length} strength(s) detected that ${collegeName} specifically values.
Suggestions MUST preserve these elements and enhance where possible.
`;

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const emoji = m.strength === 'exceptional' ? '🌟' : m.strength === 'strong' ? '✅' : '👍';

      output += `
${emoji} GREEN FLAG #${i + 1}: "${m.flagName}" (${m.strength.toUpperCase()})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detected in: "${m.matchedPhrase}"

WHAT WORKS:
${m.teaching.whatWorks}

WHY ${collegeName.toUpperCase()} VALUES THIS:
${m.evidence.source}: "${m.evidence.quote}"
${m.evidence.explanation}

SCORE BONUS:
${m.scoreImpact.bonus} on ${m.scoreImpact.dimension}

HOW TO ENHANCE (optional):
${m.teaching.howToEnhance}
`;
    }

    output += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL: Suggestions MUST NOT remove or weaken these green flags.
Polished Original should maintain these strengths.
Voice Amplifier should enhance these while adding authentic voice.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return output;
  }

  /**
   * Get summary of green flag matches for quick assessment
   */
  getSummary(output: GreenFlagAmplifierOutput): string {
    if (output.matches.length === 0) {
      return 'No college-specific strengths detected.';
    }

    const parts: string[] = [];
    if (output.exceptionalCount > 0) {
      parts.push(`${output.exceptionalCount} exceptional`);
    }
    if (output.strongCount > 0) {
      parts.push(`${output.strongCount} strong`);
    }
    if (output.positiveCount > 0) {
      parts.push(`${output.positiveCount} positive`);
    }

    return `Green flags: ${parts.join(', ')}`;
  }

  /**
   * Check if a specific phrase is protected by a green flag
   */
  isPhraseProtected(phrase: string, matches: GreenFlagMatch[]): boolean {
    const lowerPhrase = phrase.toLowerCase();
    return matches.some((m) => {
      const lowerMatch = m.matchedPhrase.toLowerCase();
      return lowerMatch.includes(lowerPhrase) || lowerPhrase.includes(lowerMatch);
    });
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const greenFlagAmplifier = new GreenFlagAmplifier();

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

/**
 * Quick function to detect college-valued strengths in essay
 */
export function detectGreenFlags(
  essayText: string,
  collegeId: string,
  promptId?: string
): GreenFlagAmplifierOutput {
  return greenFlagAmplifier.matchFlags({ essayText, collegeId, promptId });
}
