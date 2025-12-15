/**
 * Citation Attacher Service
 *
 * Automatically attaches citations to text based on detected triggers.
 *
 * **Purpose**: Take plain feedback text + detected triggers, insert superscript
 * numbers, and prepare citation display data for frontend.
 *
 * **For Students**: Makes citations non-intrusive (just small numbers) while
 * keeping full source info available on click.
 */

import type { CitationTrigger } from './citationTriggerDetector';
import type { SelectedCitation } from '../types/provenanceTypes';
import { CitationSelector } from './provenanceCitationSelector';

export interface FeedbackWithCitations {
  // Original feedback with superscript numbers inserted
  problem: string;
  why_matters: string;
  how_to_fix: string;

  // Citation data keyed by number (1, 2, 3...)
  citations: Record<number, CitationDisplayData>;
}

export interface CitationDisplayData {
  // Citation number (for superscript)
  number: number;

  // What to show on hover
  hover_preview: string;

  // What to show when expanded
  expandable: {
    simple: string; // Level 1
    medium: string; // Level 2
    detailed: string; // Level 3
  };

  // The full citation object (for reference)
  citation: SelectedCitation;
}

// ============================================================================
// CITATION ATTACHER
// ============================================================================

export class CitationAttacher {
  private citationSelector: CitationSelector;

  constructor() {
    this.citationSelector = new CitationSelector();
  }

  /**
   * Attach citations to feedback based on triggers
   *
   * Input:
   *   feedback = { problem: "...", why_matters: "...", how_to_fix: "..." }
   *   triggers = [{ type: 'weight_claim', location: 'why_matters', ... }, ...]
   *
   * Output:
   *   {
   *     problem: "... (with superscripts)",
   *     why_matters: "... (with superscripts)",
   *     citations: { 1: {...}, 2: {...} }
   *   }
   */
  attachCitations(
    feedback: {
      problem: string;
      why_matters: string;
      how_to_fix: string;
    },
    triggers: CitationTrigger[],
    context: {
      college_id: string;
      essay_type: string;
      issue_type?: string;
      severity?: string;
    }
  ): FeedbackWithCitations {
    // Step 1: Group triggers by location
    const triggersByLocation = this.groupTriggersByLocation(triggers);

    // Step 2: For each trigger, select best citation
    const citationMap = new Map<CitationTrigger, SelectedCitation[]>();

    for (const trigger of triggers) {
      const citations = this.selectCitationsForTrigger(trigger, context);
      citationMap.set(trigger, citations);
    }

    // Step 3: Insert superscript numbers into text
    let citationNumber = 1;
    const citationData: Record<number, CitationDisplayData> = {};

    let modifiedFeedback = { ...feedback };

    // Process each location
    for (const [location, locationTriggers] of Object.entries(triggersByLocation)) {
      let text = modifiedFeedback[location as keyof typeof modifiedFeedback];

      // Sort triggers by position in text (right to left to maintain indices)
      const sorted = locationTriggers.sort((a, b) => {
        const posA = text.indexOf(a.anchor_text);
        const posB = text.indexOf(b.anchor_text);
        return posB - posA; // Reverse order
      });

      for (const trigger of sorted) {
        const citations = citationMap.get(trigger);
        if (!citations || citations.length === 0) continue;

        // Use first (best) citation
        const citation = citations[0];

        // Insert superscript after anchor text
        const anchorIndex = text.indexOf(trigger.anchor_text);
        if (anchorIndex >= 0) {
          const insertPos = anchorIndex + trigger.anchor_text.length;
          text =
            text.substring(0, insertPos) +
            `<sup>${citationNumber}</sup>` +
            text.substring(insertPos);

          // Store citation data
          citationData[citationNumber] = this.formatCitationDisplay(
            citationNumber,
            citation
          );

          citationNumber++;
        }
      }

      modifiedFeedback[location as keyof typeof modifiedFeedback] = text;
    }

    return {
      ...modifiedFeedback,
      citations: citationData,
    };
  }

  // ==========================================================================
  // CITATION SELECTION BY TRIGGER TYPE
  // ==========================================================================

  /**
   * Select appropriate citations based on trigger type
   */
  private selectCitationsForTrigger(
    trigger: CitationTrigger,
    context: any
  ): SelectedCitation[] {
    const { type, context: triggerContext } = trigger;

    switch (type) {
      case 'weight_claim':
        // For weight claims, return full provenance
        if (triggerContext.value_id && triggerContext.college_id) {
          return this.citationSelector.selectWeightProof(
            triggerContext.college_id,
            triggerContext.value_id
          );
        }
        break;

      case 'severity_claim':
      case 'problem_explanation':
        // For severity/problem, return citations that justify importance
        return this.citationSelector.selectCitationsForIssue({
          issue_detected: context.issue_type || 'GENERIC',
          severity: (context.severity as any) || 'major',
          college_id: context.college_id,
          essay_type: context.essay_type,
          our_feedback: {
            problem: '',
            why_matters: '',
            how_to_fix: '',
          },
        });

      case 'elite_pattern':
        // For elite patterns, return analysis citations
        return this.citationSelector.selectCitationsForIssue({
          issue_detected: context.issue_type || 'GENERIC',
          severity: 'major',
          college_id: context.college_id,
          essay_type: context.essay_type,
          our_feedback: {
            problem: '',
            why_matters: '',
            how_to_fix: '',
          },
        });

      case 'authority_quote':
        // For authority quotes, prioritize dean quotes
        return this.citationSelector
          .selectCitationsForIssue({
            issue_detected: context.issue_type || 'GENERIC',
            severity: 'major',
            college_id: context.college_id,
            essay_type: context.essay_type,
            our_feedback: {
              problem: '',
              why_matters: '',
              how_to_fix: '',
            },
          })
          .filter((c) => c.citation.type === 'dean_quote');

      case 'technique_teaching':
        // For techniques, return teaching citations
        return this.citationSelector.selectCitationsForIssue({
          issue_detected: context.issue_type || 'GENERIC',
          severity: 'major',
          college_id: context.college_id,
          essay_type: context.essay_type,
          our_feedback: {
            problem: '',
            why_matters: '',
            how_to_fix: '',
          },
        });

      default:
        return [];
    }

    return [];
  }

  // ==========================================================================
  // CITATION DISPLAY FORMATTING
  // ==========================================================================

  /**
   * Format citation for frontend display (3 levels)
   */
  private formatCitationDisplay(
    number: number,
    citation: SelectedCitation
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
    };
  }

  /**
   * Hover preview (very short, 1 sentence)
   */
  private formatHoverPreview(citation: SelectedCitation): string {
    const source = citation.citation;

    if (source.type === 'dean_quote' && source.author) {
      return `${source.author}: "${this.truncate(source.quote || '', 60)}"`;
    }

    if (source.type === 'cds') {
      return `Stanford Common Data Set: ${this.truncate(source.finding || '', 60)}`;
    }

    if (source.type === 'internal_analysis') {
      return `Our research: ${this.truncate(source.finding || '', 60)}`;
    }

    return citation.presentation.simplified_version;
  }

  /**
   * Medium explanation (paragraph with context)
   */
  private formatMediumExplanation(citation: SelectedCitation): string {
    const source = citation.citation;
    const parts: string[] = [];

    // Who said it / what type
    if (source.type === 'dean_quote' && source.author) {
      parts.push(`**${source.author}** (${source.author_title || 'Dean of Admission'})`);
    } else if (source.type === 'cds') {
      parts.push(`**Stanford Common Data Set** (Official University Data)`);
    } else if (source.type === 'internal_analysis') {
      parts.push(`**Our Analysis** (${source.title})`);
    }

    // What they said / found
    if (source.quote) {
      parts.push(`"${source.quote}"`);
    } else if (source.finding) {
      parts.push(source.finding);
    }

    // Why it matters
    if (citation.relevance.reason) {
      parts.push(`\n*Why this matters:* ${citation.relevance.reason}`);
    }

    // Source details
    if (source.publication && source.date) {
      parts.push(`\nSource: ${source.publication}, ${source.date}`);
    }

    return parts.join('\n');
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Group triggers by location (problem, why_matters, how_to_fix)
   */
  private groupTriggersByLocation(
    triggers: CitationTrigger[]
  ): Record<string, CitationTrigger[]> {
    const grouped: Record<string, CitationTrigger[]> = {
      problem: [],
      why_matters: [],
      how_to_fix: [],
    };

    for (const trigger of triggers) {
      if (grouped[trigger.location]) {
        grouped[trigger.location].push(trigger);
      }
    }

    return grouped;
  }

  /**
   * Truncate text to max length
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

// ============================================================================
// CONVENIENCE FUNCTION: ONE-STEP CITATION
// ============================================================================

/**
 * One-step function: Detect triggers + attach citations
 *
 * Usage:
 * ```typescript
 * const result = attachCitationsToFeedback(
 *   { problem: "...", why_matters: "...", how_to_fix: "..." },
 *   { college_id: "stanford", issue_type: "CLASS_BASED_ONLY" }
 * );
 * ```
 */
export function attachCitationsToFeedback(
  feedback: {
    problem: string;
    why_matters: string;
    how_to_fix: string;
  },
  context: {
    college_id: string;
    essay_type: string;
    issue_type?: string;
    severity?: string;
  }
): FeedbackWithCitations {
  // Import here to avoid circular dependency
  const { CitationTriggerDetector } = require('./citationTriggerDetector');

  const detector = new CitationTriggerDetector();
  const attacher = new CitationAttacher();

  // Step 1: Detect triggers
  const triggers = detector.detectTriggers(feedback, context);

  // Step 2: Attach citations
  return attacher.attachCitations(feedback, triggers, context);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { CitationAttacher };
