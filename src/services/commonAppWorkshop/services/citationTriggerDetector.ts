// @ts-nocheck
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
  | 'authority_quote' // "Dean Shaw said"
  // Deep research category triggers
  | 'show_dont_tell' // Abstract language, telling instead of showing
  | 'emotional_intelligence' // Emotional maturity, vulnerability
  | 'intellectual_depth' // Intellectual sophistication, nuance
  | 'prose_quality' // Voice, rhythm, sentence craft
  | 'opening_hook' // Essay opening, first impressions
  | 'essay_endings'; // Essay conclusions, endings, closure

export interface CitationTrigger {
  type: TriggerType;
  location: string; // Which part of feedback (problem, why_matters, how_to_fix)
  anchor_text: string; // Exact text to cite
  context: {
    college_id?: string;
    value_id?: string;
    issue_type?: string;
    severity?: string;
    deep_research_category?: DeepResearchCategory; // For routing to specific source batches
  };
}

/**
 * Deep research category for explicit source routing
 * Maps to specific source batches in sourceRegistry.ts
 */
export type DeepResearchCategory =
  | 'show_dont_tell'
  | 'emotional_intelligence'
  | 'intellectual_depth'
  | 'prose_quality'
  | 'opening_lines'
  | 'essay_endings';

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

      // Deep research activation layer - explicitly route to source batches
      triggers.push(...this.detectDeepResearchOpportunities(section.text, section.key, context));
    }

    return triggers;
  }

  // ==========================================================================
  // DEEP RESEARCH ACTIVATION LAYER
  // ==========================================================================

  /**
   * Detect opportunities to cite deep research sources
   *
   * This layer explicitly identifies when specific deep research batches are relevant:
   * - Show Don't Tell: abstract language, vague claims, telling patterns
   * - Emotional Intelligence: emotional maturity, vulnerability, empathy
   * - Intellectual Depth: complexity, nuance, sophisticated thinking
   * - Prose Quality: voice, rhythm, sentence craft
   * - Opening Hooks: first impressions, hooks, opening techniques
   * - Essay Endings: conclusions, closure, peak-end rule, resolution
   */
  private detectDeepResearchOpportunities(
    text: string,
    location: string,
    context: any
  ): CitationTrigger[] {
    const triggers: CitationTrigger[] = [];
    const lowerText = text.toLowerCase();

    // 1. SHOW DON'T TELL sources
    const showDontTellPatterns = [
      /vague|abstract|generic/gi,
      /telling (rather than|instead of|not) showing/gi,
      /show\s+(don'?t|not|rather than)\s+tell/gi,
      /lacks?\s+(specific|concrete|sensory)/gi,
      /needs?\s+(more|specific|concrete)\s+detail/gi,
      /replace\s+(with|using)\s+(specific|concrete)/gi,
      /instead of saying/gi,
      /rather than stating/gi,
    ];

    for (const pattern of showDontTellPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        triggers.push({
          type: 'show_dont_tell',
          location,
          anchor_text: match[0],
          context: {
            ...context,
            deep_research_category: 'show_dont_tell',
          },
        });
      }
    }

    // 2. EMOTIONAL INTELLIGENCE sources
    const emotionalIntelligencePatterns = [
      /emotional\s+(maturity|depth|intelligence|complexity)/gi,
      /vulnerab(le|ility)/gi,
      /authentic\s+(emotion|feeling|vulnerability)/gi,
      /self-aware(ness)?/gi,
      /empathy|empathetic/gi,
      /emotional risk/gi,
      /honest (about|with) (your |yourself|feelings)/gi,
    ];

    for (const pattern of emotionalIntelligencePatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        triggers.push({
          type: 'emotional_intelligence',
          location,
          anchor_text: match[0],
          context: {
            ...context,
            deep_research_category: 'emotional_intelligence',
          },
        });
      }
    }

    // 3. INTELLECTUAL DEPTH sources
    const intellectualDepthPatterns = [
      /intellectual\s+(depth|vitality|curiosity|sophistication)/gi,
      /nuance[d]?/gi,
      /complex(ity)?\s+(thinking|argument|perspective)/gi,
      /multi-?layered/gi,
      /systems-?level\s+(thinking|awareness)/gi,
      /fresh\s+perspective/gi,
      /original\s+thinking/gi,
      /beyond\s+(surface|simple|obvious)/gi,
    ];

    for (const pattern of intellectualDepthPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        triggers.push({
          type: 'intellectual_depth',
          location,
          anchor_text: match[0],
          context: {
            ...context,
            deep_research_category: 'intellectual_depth',
          },
        });
      }
    }

    // 4. PROSE QUALITY sources
    const proseQualityPatterns = [
      /voice\s+(is|sounds|feels|needs)/gi,
      /sentence\s+(rhythm|flow|variety|structure)/gi,
      /prose\s+(quality|style|rhythm)/gi,
      /word\s+choice/gi,
      /writing\s+(style|craft)/gi,
      /sounds?\s+(authentic|genuine|natural|real)/gi,
      /reads?\s+(like|as if)/gi,
    ];

    for (const pattern of proseQualityPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        triggers.push({
          type: 'prose_quality',
          location,
          anchor_text: match[0],
          context: {
            ...context,
            deep_research_category: 'prose_quality',
          },
        });
      }
    }

    // 5. OPENING HOOKS sources
    const openingHookPatterns = [
      /opening\s+(sentence|paragraph|line|hook)/gi,
      /first\s+(sentence|impression|paragraph|line)/gi,
      /hook/gi,
      /in\s+medias\s+res/gi,
      /start(s|ing)?\s+(with|by)/gi,
      /begins?\s+(with|by)/gi,
      /lead\s+(with|into)/gi,
      /(dictionary|childhood|famous\s+quote)\s+(definition|memory|opening)/gi,
      /grabs?\s+(attention|reader|interest)/gi,
    ];

    for (const pattern of openingHookPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        triggers.push({
          type: 'opening_hook',
          location,
          anchor_text: match[0],
          context: {
            ...context,
            deep_research_category: 'opening_lines',
          },
        });
      }
    }

    // 6. ESSAY ENDINGS sources
    const essayEndingsPatterns = [
      // Ending-specific terms
      /ending\s+(sentence|paragraph|line)?/gi,
      /conclusion|concluding/gi,
      /final\s+(sentence|paragraph|line|thought)/gi,
      /closing\s+(sentence|paragraph|line|thought)/gi,
      /last\s+(sentence|paragraph|line)/gi,
      /end\s+(of|the|your)\s+(essay|story)/gi,
      // Ending techniques
      /circular\s+(return|ending|structure)/gi,
      /forward\s+momentum/gi,
      /zoom\s+out/gi,
      /widen\s+(the\s+)?lens/gi,
      /full\s+circle/gi,
      /peak-?end\s+rule/gi,
      // Ending problems
      /summary\s+conclusion/gi,
      /preachy\s+(ending|moral|lesson)/gi,
      /moral\s+(of\s+the\s+story|lesson)/gi,
      /abrupt\s+(ending|conclusion)/gi,
      /weak\s+(ending|conclusion)/gi,
      /anticlimactic/gi,
      // College-specific ending issues
      /(excited|can't wait)\s+to\s+(attend|join|be\s+part)/gi,
      /this\s+is\s+why\s+.*\s+is\s+(perfect|right)/gi,
      /career\s+(decision|announcement|goal)\s+(ending)?/gi,
      // Narrative closure
      /leaves?\s+(reader|space|room)/gi,
      /lasting\s+impression/gi,
      /memorable\s+ending/gi,
      /closure/gi,
      /resolution/gi,
      /wraps?\s+up/gi,
      /ties?\s+(together|back)/gi,
    ];

    for (const pattern of essayEndingsPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        triggers.push({
          type: 'essay_endings',
          location,
          anchor_text: match[0],
          context: {
            ...context,
            deep_research_category: 'essay_endings',
          },
        });
      }
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
