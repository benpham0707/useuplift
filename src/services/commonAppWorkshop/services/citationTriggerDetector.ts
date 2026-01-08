/**
 * Citation Trigger Detector
 *
 * Automatically detects when citations are needed in feedback/suggestions.
 *
 * **Purpose**: Scan any text output and identify where we need to cite sources.
 * No manual citation assignment—the system figures it out.
 *
 * **For Students**: Ensures you ALWAYS see sources for claims that need trust,
 * without us forgetting to cite something important.
 */

export type TriggerType =
  | 'weight_claim' // "Stanford weighs IV at 40%"
  | 'severity_claim' // "This is critical"
  | 'elite_pattern' // "87% of successful essays"
  | 'problem_explanation' // "Stanford wants X"
  | 'technique_teaching' // "Add this to show Y"
  | 'authority_quote'; // "Dean Shaw said"

export interface CitationTrigger {
  type: TriggerType;
  location: string; // Which part of feedback (problem, why_matters, how_to_fix)
  anchor_text: string; // Exact text to cite
  context: {
    college_id?: string;
    value_id?: string;
    issue_type?: string;
    severity?: string;
  };
}

// ============================================================================
// CITATION TRIGGER DETECTOR
// ============================================================================

export class CitationTriggerDetector {
  /**
   * Scan feedback and detect all citation needs
   *
   * Example:
   * Input: "Stanford weighs IV at 40% (critical)"
   * Output: [
   *   { type: 'weight_claim', anchor_text: '40%', ... },
   *   { type: 'severity_claim', anchor_text: 'critical', ... }
   * ]
   */
  detectTriggers(
    feedback: {
      problem?: string;
      why_matters?: string;
      how_to_fix?: string;
      [key: string]: any;
    },
    context: {
      college_id: string;
      issue_type?: string;
      severity?: string;
    }
  ): CitationTrigger[] {
    const triggers: CitationTrigger[] = [];

    // Scan each part of feedback
    const sections = [
      { key: 'problem', text: feedback.problem },
      { key: 'why_matters', text: feedback.why_matters },
      { key: 'how_to_fix', text: feedback.how_to_fix },
    ];

    for (const section of sections) {
      if (!section.text) continue;

      // Run all detection methods
      triggers.push(...this.detectWeightClaims(section.text, section.key, context));
      triggers.push(...this.detectSeverityClaims(section.text, section.key, context));
      triggers.push(...this.detectElitePatterns(section.text, section.key, context));
      triggers.push(...this.detectAuthorityQuotes(section.text, section.key, context));
      triggers.push(...this.detectTechniques(section.text, section.key, context));
    }

    return triggers;
  }

  // ==========================================================================
  // TRIGGER TYPE 1: WEIGHT CLAIMS
  // ==========================================================================

  /**
   * Detect mentions of value weights
   *
   * Examples:
   * - "Stanford weighs IV at 40%"
   * - "Character is 25% of Stanford's criteria"
   * - "Impact (20%)"
   */
  private detectWeightClaims(
    text: string,
    location: string,
    context: any
  ): CitationTrigger[] {
    const triggers: CitationTrigger[] = [];

    // Pattern: percentage + value name
    const weightPattern = /(\d+)%/g;
    const valuePattern =
      /(intellectual vitality|character|personal qualities|impact|leadership|voice|authentic)/gi;

    const percentMatches = [...text.matchAll(weightPattern)];
    const valueMatches = [...text.matchAll(valuePattern)];

    // If we mention both a percentage and a value → weight claim
    if (percentMatches.length > 0 && valueMatches.length > 0) {
      for (const match of percentMatches) {
        const percentage = match[0];
        const value_id = this.inferValueId(text, match.index || 0);

        triggers.push({
          type: 'weight_claim',
          location,
          anchor_text: percentage,
          context: {
            ...context,
            value_id,
          },
        });
      }
    }

    return triggers;
  }

  /**
   * Infer which value a percentage refers to
   */
  private inferValueId(text: string, percentIndex: number): string | undefined {
    const context = text.substring(Math.max(0, percentIndex - 50), percentIndex + 50);

    const valueMap: Record<string, string> = {
      'intellectual vitality': 'intellectual_vitality',
      iv: 'intellectual_vitality',
      character: 'character',
      'personal qualities': 'character',
      impact: 'impact',
      leadership: 'impact',
      voice: 'voice',
      authentic: 'voice',
    };

    for (const [keyword, id] of Object.entries(valueMap)) {
      if (context.toLowerCase().includes(keyword)) {
        return id;
      }
    }

    return undefined;
  }

  // ==========================================================================
  // TRIGGER TYPE 2: SEVERITY CLAIMS
  // ==========================================================================

  /**
   * Detect severity/importance language
   *
   * Examples:
   * - "This is critical"
   * - "Stanford's highest priority"
   * - "Most important value"
   */
  private detectSeverityClaims(
    text: string,
    location: string,
    context: any
  ): CitationTrigger[] {
    const triggers: CitationTrigger[] = [];

    const severityKeywords = [
      { pattern: /critical/gi, anchor: 'critical' },
      { pattern: /crucial/gi, anchor: 'crucial' },
      { pattern: /essential/gi, anchor: 'essential' },
      { pattern: /most important/gi, anchor: 'most important' },
      { pattern: /highest priority/gi, anchor: 'highest priority' },
      { pattern: /top priority/gi, anchor: 'top priority' },
      { pattern: /matters most/gi, anchor: 'matters most' },
    ];

    for (const { pattern, anchor } of severityKeywords) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        triggers.push({
          type: 'severity_claim',
          location,
          anchor_text: anchor,
          context: {
            ...context,
            severity: 'critical', // Presence of these words implies high severity
          },
        });
      }
    }

    return triggers;
  }

  // ==========================================================================
  // TRIGGER TYPE 3: ELITE PATTERNS
  // ==========================================================================

  /**
   * Detect references to elite essay patterns
   *
   * Examples:
   * - "87% of successful Stanford essays"
   * - "Most high-scoring essays include"
   * - "Pattern analysis shows"
   */
  private detectElitePatterns(
    text: string,
    location: string,
    context: any
  ): CitationTrigger[] {
    const triggers: CitationTrigger[] = [];

    const elitePatternIndicators = [
      // Percentage patterns
      /(\d+)%\s+of\s+(successful|high-scoring|admitted|winning)/gi,

      // Pattern analysis phrases
      /pattern analysis/gi,
      /our analysis shows/gi,
      /research shows/gi,

      // Success indicators
      /most successful essays/gi,
      /winning essays/gi,
      /high-scoring essays/gi,
    ];

    for (const pattern of elitePatternIndicators) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        triggers.push({
          type: 'elite_pattern',
          location,
          anchor_text: match[0],
          context,
        });
      }
    }

    return triggers;
  }

  // ==========================================================================
  // TRIGGER TYPE 4: AUTHORITY QUOTES
  // ==========================================================================

  /**
   * Detect references to authority figures
   *
   * Examples:
   * - "Dean Shaw said"
   * - "Stanford's dean of admission"
   * - "According to admission staff"
   */
  private detectAuthorityQuotes(
    text: string,
    location: string,
    context: any
  ): CitationTrigger[] {
    const triggers: CitationTrigger[] = [];

    const authorityPatterns = [
      /Dean\s+[A-Z][a-z]+\s+(said|stated|explained|noted)/gi,
      /dean of (admission|admissions)/gi,
      /admission (staff|director|officer)/gi,
      /according to [A-Z]/gi,
    ];

    for (const pattern of authorityPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        triggers.push({
          type: 'authority_quote',
          location,
          anchor_text: match[0],
          context,
        });
      }
    }

    return triggers;
  }

  // ==========================================================================
  // TRIGGER TYPE 5: TECHNIQUE TEACHING
  // ==========================================================================

  /**
   * Detect when we're teaching a technique
   *
   * Examples:
   * - "Add an example of X"
   * - "This shows Y"
   * - "Try including Z"
   */
  private detectTechniques(
    text: string,
    location: string,
    context: any
  ): CitationTrigger[] {
    const triggers: CitationTrigger[] = [];

    // Only detect in how_to_fix section (that's where techniques live)
    if (location !== 'how_to_fix') {
      return triggers;
    }

    const techniqueIndicators = [
      /add\s+(an|a|this)/gi,
      /include\s+(an|a|this)/gi,
      /try\s+/gi,
      /shows?\s+/gi,
      /demonstrates?\s+/gi,
      /this technique/gi,
    ];

    for (const pattern of techniqueIndicators) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        triggers.push({
          type: 'technique_teaching',
          location,
          anchor_text: match[0],
          context,
        });
      }
    }

    return triggers;
  }
}

// ============================================================================
// HELPER: DEDUPLICATE TRIGGERS
// ============================================================================

/**
 * Remove duplicate triggers (same type + location)
 */
export function deduplicateTriggers(triggers: CitationTrigger[]): CitationTrigger[] {
  const seen = new Set<string>();
  return triggers.filter((trigger) => {
    const key = `${trigger.type}:${trigger.location}:${trigger.anchor_text}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// CitationTriggerDetector already exported at class declaration
