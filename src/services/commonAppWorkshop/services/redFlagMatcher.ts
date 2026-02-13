// @ts-nocheck
/**
 * Red Flag Matcher Service
 *
 * Actively detects red flags in essay text by pattern matching against
 * college-specific red flag definitions from our research overlays.
 *
 * Key Features:
 * - Pattern matching using signalPhrases and regex patterns
 * - Returns full teaching content with Dean quotes
 * - Formats matches for prompt injection
 * - Prioritizes by severity (critical > major > minor)
 *
 * Integration: Inject output into TypeSpecificSuggestionService prompts
 * to ensure suggestions directly address college-specific mistakes.
 */

import { getCollegeResearch } from '../data';
import type { CollegeRedFlag } from '../types/collegeResearch';

// ============================================================================
// TYPES
// ============================================================================

export interface RedFlagMatcherInput {
  essayText: string;
  collegeId: string;
  promptId?: string; // Optional - if provided, only check flags applicable to this prompt
}

export interface RedFlagMatch {
  flagId: string;
  flagName: string;
  severity: 'critical' | 'major' | 'minor';
  matchedPhrase: string;
  matchLocation: number;
  teaching: {
    problem: string;
    whyItMatters: string;
    howToFix: string;
    exampleFix?: string;
  };
  evidence: {
    source: string;
    quote: string;
    explanation: string;
  };
  scoreImpact: {
    dimension: string;
    penalty: string;
  };
}

export interface RedFlagMatcherOutput {
  matches: RedFlagMatch[];
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  formattedForPrompt: string;
}

// ============================================================================
// RED FLAG MATCHER SERVICE
// ============================================================================

export class RedFlagMatcher {
  /**
   * Match red flags against essay text
   */
  matchFlags(input: RedFlagMatcherInput): RedFlagMatcherOutput {
    const college = getCollegeResearch(input.collegeId);
    if (!college) {
      return {
        matches: [],
        criticalCount: 0,
        majorCount: 0,
        minorCount: 0,
        formattedForPrompt: '',
      };
    }

    const matches: RedFlagMatch[] = [];
    const matchedFlagIds = new Set<string>();

    for (const flag of college.redFlags) {
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

    // Sort by severity (critical first)
    const sortedMatches = this.sortBySeverity(matches);

    return {
      matches: sortedMatches,
      criticalCount: sortedMatches.filter((m) => m.severity === 'critical').length,
      majorCount: sortedMatches.filter((m) => m.severity === 'major').length,
      minorCount: sortedMatches.filter((m) => m.severity === 'minor').length,
      formattedForPrompt: this.formatForPrompt(sortedMatches, input.collegeId),
    };
  }

  /**
   * Match using signal phrases (case-insensitive substring matching)
   */
  private matchSignalPhrases(
    text: string,
    flag: CollegeRedFlag
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
    flag: CollegeRedFlag
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
        console.warn(`[RedFlagMatcher] Invalid regex pattern: ${pattern}`);
      }
    }

    return null;
  }

  /**
   * Create a RedFlagMatch from a flag definition and match data
   */
  private createMatch(flag: CollegeRedFlag, matchedPhrase: string, matchLocation: number): RedFlagMatch {
    return {
      flagId: flag.flagId,
      flagName: flag.flagName,
      severity: flag.severity,
      matchedPhrase: this.extractContext(matchedPhrase, matchLocation, matchedPhrase.length),
      matchLocation,
      teaching: {
        problem: flag.teaching.problem,
        whyItMatters: flag.teaching.whyItMatters,
        howToFix: flag.teaching.howToFix,
        exampleFix: flag.teaching.exampleFix,
      },
      evidence: {
        source: flag.evidence.source,
        quote: flag.evidence.quote,
        explanation: flag.evidence.explanation,
      },
      scoreImpact: {
        dimension: flag.scoreImpact.dimension,
        penalty: flag.scoreImpact.penalty,
      },
    };
  }

  /**
   * Extract context around a match (with ellipsis for context)
   */
  private extractContext(text: string, _index: number, _matchLength: number): string {
    // For now, just return the matched text
    // TODO: Could expand to include surrounding context
    return text.length > 80 ? text.substring(0, 80) + '...' : text;
  }

  /**
   * Sort matches by severity (critical > major > minor)
   */
  private sortBySeverity(matches: RedFlagMatch[]): RedFlagMatch[] {
    const severityOrder: Record<string, number> = {
      critical: 0,
      major: 1,
      minor: 2,
    };

    return [...matches].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Format matches for injection into suggestion prompt
   */
  formatForPrompt(matches: RedFlagMatch[], collegeId?: string): string {
    if (matches.length === 0) {
      return '';
    }

    const collegeName = collegeId
      ? getCollegeResearch(collegeId)?.collegeName || collegeId.toUpperCase()
      : 'THIS COLLEGE';

    let output = `
═══════════════════════════════════════════════════════════
DETECTED RED FLAGS (MUST ADDRESS)
═══════════════════════════════════════════════════════════

${matches.length} red flag(s) detected. Suggestions MUST address these issues.
`;

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const emoji = m.severity === 'critical' ? '🚨' : m.severity === 'major' ? '⚠️' : '📝';

      output += `
${emoji} RED FLAG #${i + 1}: "${m.flagName}" (${m.severity.toUpperCase()})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Detected in: "${m.matchedPhrase}"

THE PROBLEM:
${m.teaching.problem}

WHY ${collegeName.toUpperCase()} CARES:
${m.evidence.source}: "${m.evidence.quote}"
${m.evidence.explanation}

SCORE IMPACT:
${m.scoreImpact.penalty} on ${m.scoreImpact.dimension}

HOW TO FIX:
${m.teaching.howToFix}
${m.teaching.exampleFix ? `\nEXAMPLE TRANSFORMATION:\n${m.teaching.exampleFix}` : ''}
`;
    }

    output += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ CRITICAL: All suggestions MUST address these red flags.
Polished Original should fix the issue directly.
Voice Amplifier should fix while amplifying authentic voice.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    return output;
  }

  /**
   * Get summary of red flag matches for quick assessment
   */
  getSummary(output: RedFlagMatcherOutput): string {
    if (output.matches.length === 0) {
      return 'No red flags detected.';
    }

    const parts: string[] = [];
    if (output.criticalCount > 0) {
      parts.push(`${output.criticalCount} critical`);
    }
    if (output.majorCount > 0) {
      parts.push(`${output.majorCount} major`);
    }
    if (output.minorCount > 0) {
      parts.push(`${output.minorCount} minor`);
    }

    return `Red flags: ${parts.join(', ')}`;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const redFlagMatcher = new RedFlagMatcher();

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

/**
 * Quick function to check essay for red flags
 */
export function detectRedFlags(
  essayText: string,
  collegeId: string,
  promptId?: string
): RedFlagMatcherOutput {
  return redFlagMatcher.matchFlags({ essayText, collegeId, promptId });
}
