// @ts-nocheck
/**
 * Citation Formatter - UI-Ready Conversion
 *
 * Converts citations from backend format to UI-ready format for tooltip rendering.
 *
 * **Purpose**: Transform technical citation objects into human-friendly tooltip content
 * with styling hints and accessibility support.
 *
 * **Tooltip Structure**:
 * - Title: Primary source (Dean name, flag name, value name)
 * - Subtitle: Context (Title, college, severity)
 * - Content: Main evidence (quote, description, definition)
 * - Context: Explanation of context
 * - Relevance: Why this matters to the claim
 * - Footer: Optional (score impact, weights)
 *
 * **Styling Hints**:
 * - Color: Based on citation type (blue=quote, red=red_flag, green=green_flag, etc.)
 * - Icon: Emoji or icon name for visual distinction
 *
 * **Usage**:
 * ```typescript
 * const formatter = new CitationFormatter();
 * const uiReady = formatter.formatCitation(citation, college_name);
 * // Use uiReady.tooltip for tooltip content
 * // Use uiReady.styling for visual styling
 * ```
 */

import type {
  Citation,
  UIReadyCitation,
  UIReadyText,
  ParsedText,
  CitationDatabase,
  TextWithCitations,
} from '../types';
import { citationProcessor } from '../services/citationProcessor';

// ============================================================================
// CITATION FORMATTER SERVICE
// ============================================================================

export class CitationFormatter {
  /**
   * Format a single citation for UI rendering
   *
   * Converts backend citation object into UI-ready format with:
   * - Human-friendly tooltip content
   * - Visual styling hints (colors, icons)
   * - Accessibility labels
   *
   * @param citation - Citation to format
   * @param college_name - College name for context (e.g., "Stanford")
   * @returns UI-ready citation for tooltip rendering
   */
  public formatCitation(
    citation: Citation,
    college_name: string = 'this college'
  ): UIReadyCitation {
    // HOLISTIC 3-TYPE SYSTEM
    switch (citation.type) {
      case 'problem':
        return this.formatProblemCitation(citation, college_name);
      case 'strength':
        return this.formatStrengthCitation(citation, college_name);
      case 'teaching':
        return this.formatTeachingCitation(citation, college_name);
    }
  }

  /**
   * Format PROBLEM citation (RED HIGHLIGHT)
   * @private
   */
  private formatProblemCitation(
    citation: Citation,
    college_name: string
  ): UIReadyCitation {
    if (citation.type !== 'problem') {
      throw new Error('Citation type mismatch');
    }

    const { source, evidence, why_relevant } = citation;

    // Determine emoji based on severity
    const severityEmoji = {
      critical: '🚨',
      major: '⚠️',
      minor: '⚡',
      optimization: '💡',
    };

    return {
      id: citation.id,
      tooltip: {
        title: `${severityEmoji[evidence.severity]} ${evidence.problem_name}`,
        subtitle: `${college_name} Issue (${this.capitalizeFirst(evidence.severity)})`,
        content: evidence.why_matters,
        context: `What triggered it: ${evidence.what_triggered_it}`,
        relevance: why_relevant,
        footer: `Score Impact: ${evidence.score_impact}`,
      },
      styling: {
        type: 'problem',
        inline_style: 'red_highlight',  // RED HIGHLIGHT in text
        background_color: '#FEE2E2',     // Light red background
        box_indicator_color: '#EF4444',  // Red in citation box
        icon_hint: severityEmoji[evidence.severity],
        severity: evidence.severity,
      },
      accessibility: {
        aria_label: `Problem: ${evidence.problem_name}`,
        description: `${evidence.problem_name} (${evidence.severity}): ${evidence.why_matters}. ${why_relevant}`,
      },
    };
  }

  /**
   * Format STRENGTH citation (GREEN UNDERLINE)
   * Consolidates green_flag + value from old system
   * @private
   */
  private formatStrengthCitation(
    citation: Citation,
    college_name: string
  ): UIReadyCitation {
    if (citation.type !== 'strength') {
      throw new Error('Citation type mismatch');
    }

    const { source, evidence, why_relevant } = citation;

    // Build title based on strength_type
    let title: string;
    let subtitle: string;
    let icon = '✅';

    if (evidence.strength_type === 'core_value') {
      // This is a core value being demonstrated
      const weightDisplay = evidence.value_weight ? ` (${evidence.value_weight}%)` : '';
      title = `${icon} ${evidence.strength_name}`;
      subtitle = `${college_name} Core Value${weightDisplay}`;
    } else {
      // This is a pattern/green flag
      const strengthEmoji = {
        exceptional: '🌟',
        strong: '✅',
        positive: '👍',
      };
      icon = evidence.pattern_strength ? strengthEmoji[evidence.pattern_strength] : '✅';
      title = `${icon} ${evidence.strength_name}`;
      subtitle = `${college_name} Strength (${this.capitalizeFirst(evidence.pattern_strength || 'positive')})`;
    }

    return {
      id: citation.id,
      tooltip: {
        title,
        subtitle,
        content: `You demonstrated: ${evidence.what_demonstrates_it}`,
        context: `What's working: ${evidence.why_valued}`,
        relevance: why_relevant,
        footer: `Score Impact: ${evidence.score_impact}`,
      },
      styling: {
        type: 'strength',
        inline_style: 'green_underline',  // GREEN UNDERLINE in text (no background)
        underline_color: '#10B981',       // Green underline
        box_indicator_color: '#10B981',   // Green in citation box
        icon_hint: icon,
        strength_type: evidence.strength_type,
        pattern_strength: evidence.pattern_strength,
      },
      accessibility: {
        aria_label: `Strength: ${evidence.strength_name}`,
        description: `${evidence.strength_name}: You demonstrated ${evidence.what_demonstrates_it}. ${why_relevant}`,
      },
    };
  }

  /**
   * Format TEACHING citation (PURPLE BOX ONLY - no inline styling)
   * Consolidates quote + example from old system
   * @private
   */
  private formatTeachingCitation(
    citation: Citation,
    college_name: string
  ): UIReadyCitation {
    if (citation.type !== 'teaching') {
      throw new Error('Citation type mismatch');
    }

    const { source, evidence, why_relevant } = citation;

    let title: string;
    let subtitle: string;
    let content: string;
    let context: string;
    let footer: string | undefined;
    let icon = '💡';

    if (evidence.teaching_type === 'elite_technique') {
      // Elite example technique
      icon = '🌟';
      const scoreDisplay = evidence.example_score ? ` (Score: ${evidence.example_score}/100)` : '';
      title = `${icon} Elite Technique`;
      subtitle = `From ${evidence.example_id}${scoreDisplay}`;
      content = evidence.example_quote || evidence.technique;
      context = `Technique to apply: ${evidence.technique}`;
      footer = evidence.dean_quote ? `Dean says: "${evidence.dean_quote}"` : undefined;
    } else if (evidence.teaching_type === 'dean_quote') {
      // Dean/AO quote
      icon = '🎓';
      title = evidence.dean_name || source.name;
      subtitle = evidence.dean_title || source.title;
      if (evidence.dean_publication) {
        subtitle += `, ${evidence.dean_publication}`;
      }
      content = `"${evidence.dean_quote}"`;
      context = evidence.dean_context || '';
      footer = undefined;
    } else {
      // General teaching principle
      icon = '💡';
      title = `${icon} Teaching Principle`;
      subtitle = evidence.principle || 'How to improve';
      content = evidence.application || evidence.technique;
      context = why_relevant;
      footer = undefined;
    }

    return {
      id: citation.id,
      tooltip: {
        title,
        subtitle,
        content,
        context,
        relevance: why_relevant,
        footer,
      },
      styling: {
        type: 'teaching',
        inline_style: 'none',             // NO inline styling (keeps text clean)
        box_indicator_color: '#8B5CF6',   // Purple in citation box only
        icon_hint: icon,
      },
      accessibility: {
        aria_label: `Teaching: ${evidence.teaching_type}`,
        description: `${evidence.teaching_type}: ${content}. ${why_relevant}`,
      },
    };
  }

  /**
   * Format complete text with citations for UI
   *
   * Parses text with citation markers and converts to UI-ready format
   * with all citations formatted for tooltips.
   *
   * @param text - Text with citation markers
   * @param citations - Citation database
   * @param college_name - College name for context
   * @returns UI-ready text with formatted citations
   */
  public formatTextWithCitations(
    text: TextWithCitations,
    citations: CitationDatabase,
    college_name: string = 'this college'
  ): UIReadyText {
    // Parse text to get spans
    const parsed = citationProcessor.parseTextWithCitations(text, citations);

    // Format each span with citation (if cited)
    const spans = parsed.spans.map(span => {
      if (span.citation_id && citations.citations[span.citation_id]) {
        const citation = citations.citations[span.citation_id];
        const formatted = this.formatCitation(citation, college_name);

        return {
          text: span.text,
          citation_id: span.citation_id,
          citation: formatted,
          start_pos: span.start_pos,
          end_pos: span.end_pos,
        };
      }

      // Non-cited span
      return {
        text: span.text,
        citation_id: null,
        start_pos: span.start_pos,
        end_pos: span.end_pos,
      };
    });

    return {
      original: text,
      plain_text: parsed.plain_text,
      spans,
    };
  }

  /**
   * Format entire citation database for UI
   *
   * Converts all citations in database to UI-ready format
   *
   * @param citations - Citation database
   * @param college_name - College name for context
   * @returns Record of citation_id → UI-ready citation
   */
  public formatCitationDatabase(
    citations: CitationDatabase,
    college_name: string = 'this college'
  ): Record<string, UIReadyCitation> {
    const formatted: Record<string, UIReadyCitation> = {};

    Object.entries(citations.citations).forEach(([id, citation]) => {
      formatted[id] = this.formatCitation(citation, college_name);
    });

    return formatted;
  }

  /**
   * Generate tooltip HTML string (for simple rendering)
   *
   * Creates a formatted HTML string for tooltip content.
   * UI can use this directly or build custom React components.
   *
   * @param uiCitation - UI-ready citation
   * @returns HTML string for tooltip
   */
  public generateTooltipHTML(uiCitation: UIReadyCitation): string {
    const { tooltip, styling } = uiCitation;

    return `
      <div class="citation-tooltip citation-${styling.type}" style="color: ${styling.color_hint}">
        <div class="tooltip-header">
          <div class="tooltip-icon">${styling.icon_hint}</div>
          <div class="tooltip-title">${this.escapeHTML(tooltip.title)}</div>
        </div>
        <div class="tooltip-subtitle">${this.escapeHTML(tooltip.subtitle)}</div>
        <hr>
        <div class="tooltip-content">${this.escapeHTML(tooltip.content)}</div>
        ${tooltip.context ? `<div class="tooltip-context">${this.escapeHTML(tooltip.context)}</div>` : ''}
        ${tooltip.relevance ? `<div class="tooltip-relevance"><strong>Why this matters:</strong> ${this.escapeHTML(tooltip.relevance)}</div>` : ''}
        ${tooltip.footer ? `<div class="tooltip-footer">${this.escapeHTML(tooltip.footer)}</div>` : ''}
      </div>
    `.trim();
  }

  /**
   * Generate React component props (for React rendering)
   *
   * Creates props object that can be spread into a React tooltip component.
   *
   * @param uiCitation - UI-ready citation
   * @returns Props object for React component
   */
  public generateReactProps(uiCitation: UIReadyCitation): Record<string, any> {
    const { tooltip, styling, accessibility } = uiCitation;

    return {
      // Content
      title: tooltip.title,
      subtitle: tooltip.subtitle,
      content: tooltip.content,
      context: tooltip.context,
      relevance: tooltip.relevance,
      footer: tooltip.footer,

      // Styling
      type: styling.type,
      severity: styling.severity,
      strength: styling.strength,
      colorHint: styling.color_hint,
      icon: styling.icon_hint,

      // Accessibility
      'aria-label': accessibility.aria_label,
      'aria-description': accessibility.description,
      role: 'tooltip',
    };
  }

  // ========== UTILITY METHODS ==========

  /**
   * Format ISO date string for display
   * @private
   */
  private formatDate(isoDate: string): string {
    try {
      const date = new Date(isoDate + '-01'); // Add day if missing
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
    } catch {
      return isoDate; // Return as-is if parsing fails
    }
  }

  /**
   * Capitalize first letter of string
   * @private
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Escape HTML for safe rendering
   * @private
   */
  private escapeHTML(str: string): string {
    // Simple HTML escaping that works in both Node and browser
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Truncate text to max length with ellipsis
   * @private
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const citationFormatter = new CitationFormatter();

// ============================================================================
// QUICK UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick function to format a citation
 */
export function formatCitation(
  citation: Citation,
  college_name?: string
): UIReadyCitation {
  return citationFormatter.formatCitation(citation, college_name);
}

/**
 * Quick function to format text with citations
 */
export function formatTextWithCitations(
  text: TextWithCitations,
  citations: CitationDatabase,
  college_name?: string
): UIReadyText {
  return citationFormatter.formatTextWithCitations(text, citations, college_name);
}

/**
 * Quick function to generate tooltip HTML
 */
export function generateTooltipHTML(uiCitation: UIReadyCitation): string {
  return citationFormatter.generateTooltipHTML(uiCitation);
}
