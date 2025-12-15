/**
 * Universal Citation Engine
 *
 * **Purpose**: Apply citations to ANY text - feedback, insights, teaching, comparisons, etc.
 * Handles any content type, any college, any context.
 *
 * **Design**: Flexible, context-aware, self-adjusting citation system that works
 * with feedback, teaching moments, portfolio insights, comparison views, or any
 * text that makes claims needing sources.
 *
 * **For Students**: Citations appear automatically wherever you see claims about
 * colleges, weights, patterns, or recommendations—no matter what page you're on.
 */

import { CitationTriggerDetector, type CitationTrigger } from './citationTriggerDetector';
import { CitationSelector } from './provenanceCitationSelector';
import type { SelectedCitation } from '../types/provenanceTypes';

// ============================================================================
// UNIVERSAL TYPES (Works with ANY content)
// ============================================================================

/**
 * ANY piece of text that might need citations
 */
export interface CitableContent {
  // The text (can be any structure)
  content: string | { [key: string]: string };

  // Context for citation selection
  context: {
    college_id: string; // Which college (stanford, harvard, mit)
    content_type: ContentType; // What kind of content is this?
    issue_type?: string; // If it's issue-related
    severity?: 'critical' | 'major' | 'minor';
    essay_type?: string; // If essay-specific
    student_id?: string; // For personalization
  };

  // Optional: Override citation behavior
  citation_config?: CitationConfig;
}

/**
 * What type of content is being cited?
 */
export type ContentType =
  | 'workshop_feedback' // Stage 1B feedback (problem, why_matters, how_to_fix)
  | 'teaching_moment' // Teaching layer explanations
  | 'portfolio_insight' // Portfolio coherence analysis
  | 'comparison_view' // College A vs College B
  | 'alignment_score' // Real-time alignment dashboard
  | 'college_profile' // College values & weights display
  | 'quick_win' // Quick improvement suggestions
  | 'elite_pattern' // Elite essay pattern showcase
  | 'generic_insight'; // Any other insight/suggestion

/**
 * Configuration for citation behavior
 */
export interface CitationConfig {
  // How aggressive should citation detection be?
  sensitivity: 'high' | 'medium' | 'low'; // high = cite everything, low = only critical

  // Maximum citations per text block
  max_citations?: number; // Default: 5 for critical, 3 for major, 2 for minor

  // Should we auto-expand citations in certain contexts?
  auto_expand?: boolean; // Default: false (user clicks to expand)

  // Preferred citation level for this content
  default_level?: 'simple' | 'medium' | 'detailed'; // Which level shows first

  // Should we include confidence scores in display?
  show_confidence?: boolean; // Default: true
}

/**
 * Result after citations applied
 */
export interface CitedContent {
  // Original content with citations inserted
  content: string | { [key: string]: string };

  // Citation data (keyed by number)
  citations: Record<number, CitationDisplayData>;

  // Metadata
  metadata: {
    total_triggers: number;
    total_citations: number;
    citation_coverage: number; // Percentage of claims cited
    content_type: ContentType;
  };
}

export interface CitationDisplayData {
  number: number;
  hover_preview: string;
  expandable: {
    simple: string;
    medium: string;
    detailed: string;
  };
  citation: SelectedCitation;
  confidence?: number; // Optional confidence score (0-100)
}

// ============================================================================
// UNIVERSAL CITATION ENGINE
// ============================================================================

export class UniversalCitationEngine {
  private detector: CitationTriggerDetector;
  private selector: CitationSelector;

  constructor() {
    this.detector = new CitationTriggerDetector();
    this.selector = new CitationSelector();
  }

  /**
   * Apply citations to ANY content
   *
   * This is the ONE function you need. It works with:
   * - Workshop feedback (problem, why_matters, how_to_fix)
   * - Teaching explanations
   * - Portfolio insights
   * - Comparison views
   * - Alignment scores
   * - College profiles
   * - Literally any text
   *
   * Usage:
   * ```typescript
   * const result = engine.cite({
   *   content: "Stanford weighs IV at 40% (critical for your essay)",
   *   context: {
   *     college_id: 'stanford',
   *     content_type: 'workshop_feedback',
   *     severity: 'critical'
   *   }
   * });
   * ```
   */
  cite(input: CitableContent): CitedContent {
    // Step 1: Normalize content to workable format
    const normalized = this.normalizeContent(input.content);

    // Step 2: Detect triggers in ALL text sections
    const triggers = this.detectAllTriggers(normalized, input.context);

    // Step 3: Select citations for each trigger
    const citationMap = this.selectCitationsForTriggers(triggers, input.context);

    // Step 4: Apply config (filter by sensitivity, max citations, etc.)
    const config = input.citation_config || this.getDefaultConfig(input.context);
    const filteredCitations = this.applyCitationConfig(citationMap, config);

    // Step 5: Insert citations into text
    const citedContent = this.insertCitations(
      normalized,
      filteredCitations,
      input.context.content_type
    );

    // Step 6: Calculate metadata
    const metadata = {
      total_triggers: triggers.length,
      total_citations: Object.keys(citedContent.citations).length,
      citation_coverage: this.calculateCoverage(triggers, citedContent.citations),
      content_type: input.context.content_type,
    };

    return {
      content: this.denormalizeContent(citedContent.content, input.content),
      citations: citedContent.citations,
      metadata,
    };
  }

  /**
   * Batch cite multiple pieces of content
   *
   * Usage: Cite entire portfolio of essays at once
   */
  citeBatch(inputs: CitableContent[]): CitedContent[] {
    return inputs.map((input) => this.cite(input));
  }

  /**
   * Preview citations without applying
   *
   * Usage: See what would be cited before committing
   */
  previewCitations(input: CitableContent): {
    triggers: CitationTrigger[];
    would_cite: number;
    preview: string[];
  } {
    const normalized = this.normalizeContent(input.content);
    const triggers = this.detectAllTriggers(normalized, input.context);

    return {
      triggers,
      would_cite: triggers.length,
      preview: triggers.map((t) => `"${t.anchor_text}" → ${t.type}`),
    };
  }

  // ==========================================================================
  // CONTENT NORMALIZATION (Handle any structure)
  // ==========================================================================

  /**
   * Convert any content structure to normalized format
   */
  private normalizeContent(
    content: string | { [key: string]: string }
  ): { [key: string]: string } {
    // If already object, return as-is
    if (typeof content === 'object') {
      return content;
    }

    // If string, wrap in generic section
    return { text: content };
  }

  /**
   * Convert back to original format
   */
  private denormalizeContent(
    normalized: { [key: string]: string },
    original: string | { [key: string]: string }
  ): string | { [key: string]: string } {
    // If original was string, extract text
    if (typeof original === 'string') {
      return normalized.text || normalized[Object.keys(normalized)[0]];
    }

    // If original was object, return normalized
    return normalized;
  }

  // ==========================================================================
  // TRIGGER DETECTION (All content types)
  // ==========================================================================

  /**
   * Detect triggers across all sections of content
   */
  private detectAllTriggers(
    content: { [key: string]: string },
    context: CitableContent['context']
  ): CitationTrigger[] {
    const allTriggers: CitationTrigger[] = [];

    // Detect in each section
    for (const [section, text] of Object.entries(content)) {
      if (!text || text.trim().length === 0) continue;

      const triggers = this.detector.detectTriggers(
        { [section]: text },
        {
          college_id: context.college_id,
          issue_type: context.issue_type,
          severity: context.severity,
        }
      );

      allTriggers.push(...triggers);
    }

    // Deduplicate
    return this.deduplicateTriggers(allTriggers);
  }

  /**
   * Remove duplicate triggers
   */
  private deduplicateTriggers(triggers: CitationTrigger[]): CitationTrigger[] {
    const seen = new Set<string>();
    return triggers.filter((trigger) => {
      const key = `${trigger.type}:${trigger.location}:${trigger.anchor_text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ==========================================================================
  // CITATION SELECTION (Context-aware)
  // ==========================================================================

  /**
   * Select best citations for all triggers
   */
  private selectCitationsForTriggers(
    triggers: CitationTrigger[],
    context: CitableContent['context']
  ): Map<CitationTrigger, SelectedCitation[]> {
    const citationMap = new Map<CitationTrigger, SelectedCitation[]>();

    for (const trigger of triggers) {
      const citations = this.selectForTrigger(trigger, context);
      if (citations.length > 0) {
        citationMap.set(trigger, citations);
      }
    }

    return citationMap;
  }

  /**
   * Select citation for a single trigger
   */
  private selectForTrigger(
    trigger: CitationTrigger,
    context: CitableContent['context']
  ): SelectedCitation[] {
    // Weight claims → full provenance
    if (trigger.type === 'weight_claim' && trigger.context.value_id) {
      return this.selector.selectWeightProof(
        context.college_id,
        trigger.context.value_id
      );
    }

    // All other triggers → issue-based selection
    return this.selector.selectCitationsForIssue({
      issue_detected: context.issue_type || 'GENERIC',
      severity: context.severity || 'major',
      college_id: context.college_id,
      essay_type: context.essay_type || 'generic',
      our_feedback: {
        problem: '',
        why_matters: '',
        how_to_fix: '',
      },
    });
  }

  // ==========================================================================
  // CITATION CONFIG APPLICATION
  // ==========================================================================

  /**
   * Apply configuration to filter/prioritize citations
   */
  private applyCitationConfig(
    citationMap: Map<CitationTrigger, SelectedCitation[]>,
    config: CitationConfig
  ): Map<CitationTrigger, SelectedCitation[]> {
    const filtered = new Map<CitationTrigger, SelectedCitation[]>();

    // Apply sensitivity filter
    let triggers = Array.from(citationMap.keys());

    if (config.sensitivity === 'low') {
      // Only cite critical triggers (weight_claim, severity_claim)
      triggers = triggers.filter(
        (t) => t.type === 'weight_claim' || t.type === 'severity_claim'
      );
    } else if (config.sensitivity === 'medium') {
      // Cite critical + elite patterns
      triggers = triggers.filter(
        (t) =>
          t.type === 'weight_claim' ||
          t.type === 'severity_claim' ||
          t.type === 'elite_pattern'
      );
    }
    // High sensitivity = cite everything (no filter)

    // Apply max citations limit
    const maxCitations = config.max_citations || 5;
    const topTriggers = triggers.slice(0, maxCitations);

    // Build filtered map
    for (const trigger of topTriggers) {
      const citations = citationMap.get(trigger);
      if (citations) {
        filtered.set(trigger, citations);
      }
    }

    return filtered;
  }

  /**
   * Get default config based on content type
   */
  private getDefaultConfig(context: CitableContent['context']): CitationConfig {
    const configs: Record<ContentType, CitationConfig> = {
      workshop_feedback: {
        sensitivity: 'high', // Cite everything in feedback
        max_citations: 5,
        default_level: 'simple',
        show_confidence: true,
      },

      teaching_moment: {
        sensitivity: 'medium', // Cite key claims in teaching
        max_citations: 3,
        default_level: 'medium', // Show more detail for teaching
        show_confidence: true,
      },

      portfolio_insight: {
        sensitivity: 'high', // Portfolio analysis needs strong backing
        max_citations: 5,
        default_level: 'simple',
        show_confidence: true,
      },

      comparison_view: {
        sensitivity: 'high', // Comparisons need citations for both colleges
        max_citations: 8, // More citations (2 colleges)
        default_level: 'simple',
        show_confidence: false, // Less clutter in comparisons
      },

      alignment_score: {
        sensitivity: 'medium', // Cite key alignment claims
        max_citations: 4,
        default_level: 'simple',
        show_confidence: true,
      },

      college_profile: {
        sensitivity: 'high', // Profile page needs full citations
        max_citations: 10, // Show all value provenances
        default_level: 'medium', // Students want detail here
        show_confidence: true,
      },

      quick_win: {
        sensitivity: 'low', // Quick wins are actionable, not educational
        max_citations: 2,
        default_level: 'simple',
        show_confidence: false,
      },

      elite_pattern: {
        sensitivity: 'high', // Pattern showcase needs research backing
        max_citations: 3,
        default_level: 'detailed', // Show full methodology
        show_confidence: true,
      },

      generic_insight: {
        sensitivity: 'medium', // Default middle ground
        max_citations: 3,
        default_level: 'simple',
        show_confidence: true,
      },
    };

    return configs[context.content_type] || configs.generic_insight;
  }

  // ==========================================================================
  // CITATION INSERTION (Works with any structure)
  // ==========================================================================

  /**
   * Insert citations into content
   */
  private insertCitations(
    content: { [key: string]: string },
    citationMap: Map<CitationTrigger, SelectedCitation[]>,
    contentType: ContentType
  ): {
    content: { [key: string]: string };
    citations: Record<number, CitationDisplayData>;
  } {
    let citationNumber = 1;
    const citations: Record<number, CitationDisplayData> = {};
    const modifiedContent = { ...content };

    // Group triggers by section
    const triggersBySection = new Map<string, CitationTrigger[]>();
    for (const trigger of citationMap.keys()) {
      const section = trigger.location;
      if (!triggersBySection.has(section)) {
        triggersBySection.set(section, []);
      }
      triggersBySection.get(section)!.push(trigger);
    }

    // Insert citations in each section
    for (const [section, sectionTriggers] of triggersBySection.entries()) {
      if (!modifiedContent[section]) continue;

      let text = modifiedContent[section];

      // Sort triggers right-to-left to preserve indices
      const sorted = sectionTriggers.sort((a, b) => {
        const posA = text.indexOf(a.anchor_text);
        const posB = text.indexOf(b.anchor_text);
        return posB - posA;
      });

      for (const trigger of sorted) {
        const triggerCitations = citationMap.get(trigger);
        if (!triggerCitations || triggerCitations.length === 0) continue;

        const citation = triggerCitations[0]; // Use best citation

        // Find anchor position
        const anchorIndex = text.indexOf(trigger.anchor_text);
        if (anchorIndex >= 0) {
          const insertPos = anchorIndex + trigger.anchor_text.length;
          text =
            text.substring(0, insertPos) +
            `<sup>${citationNumber}</sup>` +
            text.substring(insertPos);

          // Store citation data
          citations[citationNumber] = this.formatCitationDisplay(
            citationNumber,
            citation,
            contentType
          );

          citationNumber++;
        }
      }

      modifiedContent[section] = text;
    }

    return { content: modifiedContent, citations };
  }

  /**
   * Format citation for display
   */
  private formatCitationDisplay(
    number: number,
    citation: SelectedCitation,
    contentType: ContentType
  ): CitationDisplayData {
    return {
      number,
      hover_preview: this.formatHoverPreview(citation),
      expandable: {
        simple: citation.presentation.simplified_version,
        medium: this.formatMediumExplanation(citation),
        detailed: citation.presentation.full_version,
      },
      citation,
      confidence: citation.relevance.score,
    };
  }

  /**
   * Format hover preview
   */
  private formatHoverPreview(citation: SelectedCitation): string {
    const source = citation.citation;

    if (source.type === 'dean_quote' && source.author) {
      return `${source.author}: "${this.truncate(source.quote || '', 60)}"`;
    }

    if (source.type === 'cds') {
      return `Official data: ${this.truncate(source.finding || '', 60)}`;
    }

    if (source.type === 'internal_analysis') {
      return `Research: ${this.truncate(source.finding || '', 60)}`;
    }

    return citation.presentation.simplified_version;
  }

  /**
   * Format medium explanation
   */
  private formatMediumExplanation(citation: SelectedCitation): string {
    const source = citation.citation;
    const parts: string[] = [];

    if (source.type === 'dean_quote' && source.author) {
      parts.push(`**${source.author}** (${source.author_title || 'Dean of Admission'})`);
    } else if (source.type === 'cds') {
      parts.push(`**Common Data Set** (Official University Data)`);
    } else if (source.type === 'internal_analysis') {
      parts.push(`**Our Research** (${source.title})`);
    }

    if (source.quote) {
      parts.push(`"${source.quote}"`);
    } else if (source.finding) {
      parts.push(source.finding);
    }

    if (citation.relevance.reason) {
      parts.push(`\n*Why this matters:* ${citation.relevance.reason}`);
    }

    if (source.publication && source.date) {
      parts.push(`\nSource: ${source.publication}, ${source.date}`);
    }

    return parts.join('\n');
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  private calculateCoverage(
    triggers: CitationTrigger[],
    citations: Record<number, CitationDisplayData>
  ): number {
    if (triggers.length === 0) return 100;
    return Math.round((Object.keys(citations).length / triggers.length) * 100);
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick cite - One function for everything
 *
 * Usage:
 * ```typescript
 * const result = quickCite(
 *   "Stanford weighs IV at 40% (critical)",
 *   { college_id: 'stanford', content_type: 'workshop_feedback' }
 * );
 * ```
 */
export function quickCite(
  content: string | { [key: string]: string },
  context: {
    college_id: string;
    content_type: ContentType;
    issue_type?: string;
    severity?: 'critical' | 'major' | 'minor';
  },
  config?: CitationConfig
): CitedContent {
  const engine = new UniversalCitationEngine();
  return engine.cite({
    content,
    context,
    citation_config: config,
  });
}

/**
 * Cite workshop feedback (most common use case)
 */
export function citeWorkshopFeedback(
  feedback: {
    problem: string;
    why_matters: string;
    how_to_fix: string;
  },
  context: {
    college_id: string;
    issue_type: string;
    severity: 'critical' | 'major' | 'minor';
    essay_type?: string;
  }
): CitedContent {
  return quickCite(feedback, {
    college_id: context.college_id,
    content_type: 'workshop_feedback',
    issue_type: context.issue_type,
    severity: context.severity,
  });
}

/**
 * Cite teaching moment
 */
export function citeTeachingMoment(
  teaching: string,
  context: {
    college_id: string;
    topic: string;
  }
): CitedContent {
  return quickCite(teaching, {
    college_id: context.college_id,
    content_type: 'teaching_moment',
  });
}

/**
 * Cite portfolio insight
 */
export function citePortfolioInsight(
  insight: string,
  context: {
    college_id: string;
  }
): CitedContent {
  return quickCite(insight, {
    college_id: context.college_id,
    content_type: 'portfolio_insight',
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export { UniversalCitationEngine };
