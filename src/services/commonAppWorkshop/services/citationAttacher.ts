// @ts-nocheck
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

import type { CitationTrigger, DeepResearchCategory } from './citationTriggerDetector';
import type { SelectedCitation } from '../types/provenanceTypes';
import { CitationSelector } from './provenanceCitationSelector';
import { SmartSourceSelector } from './smartSourceSelector';
import { DiverseSourceOrchestrator } from './diverseSourceOrchestrator';
import type { SourceBundle, CollegeId, ClicheSymptomType } from '../types/labeledSourceTypes';

// ============================================================================
// DEEP RESEARCH CATEGORY → SYMPTOM TYPE MAPPING
// ============================================================================

/**
 * Maps deep research categories to their corresponding symptom types for source selection.
 * This allows us to route detected triggers to the appropriate source batch.
 */
const DEEP_RESEARCH_SYMPTOM_MAPPING: Record<DeepResearchCategory, ClicheSymptomType[]> = {
  show_dont_tell: [
    'telling_not_showing',
    'vague_language',
    'abstract_statements',
    'generic_claims',
    'emotional_labeling',
  ],
  emotional_intelligence: [
    'surface_level_reflection',
    'performative_authenticity',
    'emotional_avoidance',
    'forced_positivity',
    'unearned_resolution',
  ],
  intellectual_depth: [
    'superficial_analysis',
    'binary_thinking',
    'missing_nuance',
    'unsupported_claims',
    'shallow_reflection',
  ],
  prose_quality: [
    'cliche_language',
    'weak_word_choice',
    'passive_voice_overuse',
    'sentence_monotony',
    'unclear_structure',
  ],
  opening_hook: [
    'dictionary_definition_opening',
    'childhood_opening_cliche',
    'famous_quote_opening',
    'rhetorical_question_flat',
    'thesis_statement_opening',
    'melodramatic_opening',
    'generic_scene_setting',
    'weak_opening',
    'generic_opening',
  ],
  essay_endings: [
    'weak_ending',
    'abrupt_ending',
    'summary_conclusion',
    'preachy_ending',
    'excited_to_attend_ending',
    'career_announcement_ending',
    'sudden_pivot_ending',
    'false_resolution_ending',
    'overexplained_ending',
    'anticlimactic_ending',
    'repetitive_ending',
    'abstract_ending',
    'academic_ending',
    'generic_ending',
  ],
};

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

  // The quote/insight being cited
  quote: string;

  // Source information
  source: {
    author: string;
    title: string;           // Author's title/role
    publication: string;     // Where this came from
    url?: string;            // Link to source if available
    year?: string;           // Publication year
  };

  // Why this citation is relevant (brief context)
  relevance: string;

  // The full citation object (for reference/backwards compatibility)
  citation: SelectedCitation;
}

// ============================================================================
// CITATION ATTACHER
// ============================================================================

export class CitationAttacher {
  private citationSelector: CitationSelector;
  private smartSourceSelector: SmartSourceSelector;
  private diverseOrchestrator: DiverseSourceOrchestrator;

  constructor() {
    this.citationSelector = new CitationSelector();
    this.smartSourceSelector = new SmartSourceSelector();
    this.diverseOrchestrator = new DiverseSourceOrchestrator();
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
    // Step 1: Separate deep research triggers from legacy triggers
    const deepResearchCategories = [
      'show_dont_tell', 'emotional_intelligence', 'intellectual_depth',
      'prose_quality', 'opening_hook', 'essay_endings'
    ];
    const deepTriggers = triggers.filter(t => deepResearchCategories.includes(t.type));
    const legacyTriggers = triggers.filter(t => !deepResearchCategories.includes(t.type));

    // Step 2: Use DiverseSourceOrchestrator for deep research triggers (coordinated, diverse selection)
    const orchestratorResult = this.diverseOrchestrator.selectSourcesForFeedback(
      deepTriggers,
      {
        college_id: context.college_id,
        essay_type: context.essay_type,
        issue_type: context.issue_type,
      }
    );

    // Step 3: Build citation map combining orchestrator results + legacy selections
    const citationMap = new Map<CitationTrigger, SelectedCitation[]>();

    // Add orchestrator selections (single source per trigger, already deduplicated)
    for (const [trigger, citation] of orchestratorResult.selections) {
      citationMap.set(trigger, [citation]);
    }

    // Add legacy selections (per-trigger independent selection)
    for (const trigger of legacyTriggers) {
      const citations = this.selectCitationsForTrigger(trigger, context);
      citationMap.set(trigger, citations);
    }

    // Step 4: Group triggers by location
    const processedTriggers = [...orchestratorResult.selections.keys(), ...legacyTriggers];
    const triggersByLocation = this.groupTriggersByLocation(processedTriggers);

    // Step 5: Insert superscript numbers into text
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

      // ========================================================================
      // DEEP RESEARCH CATEGORIES - Route to SmartSourceSelector
      // ========================================================================
      case 'show_dont_tell':
      case 'emotional_intelligence':
      case 'intellectual_depth':
      case 'prose_quality':
      case 'opening_hook':
      case 'essay_endings':
        return this.selectFromDeepResearch(
          type as DeepResearchCategory,
          context.college_id as CollegeId,
          context.issue_type,
          context.essay_type
        );

      default:
        return [];
    }

    return [];
  }

  // ==========================================================================
  // DEEP RESEARCH SOURCE SELECTION
  // ==========================================================================

  /**
   * Select citations from deep research sources via SmartSourceSelector.
   *
   * This method:
   * 1. Maps the deep research category to relevant symptom types
   * 2. Uses SmartSourceSelector to get best-matching sources
   * 3. Converts SourceBundle to SelectedCitation[] format
   */
  private selectFromDeepResearch(
    category: DeepResearchCategory,
    collegeId: CollegeId,
    issueType?: string,
    essayType?: string
  ): SelectedCitation[] {
    // Get the symptom types for this category
    const symptomTypes = DEEP_RESEARCH_SYMPTOM_MAPPING[category] || [];

    // Determine best symptom type to use
    const symptomType = issueType && symptomTypes.includes(issueType as ClicheSymptomType)
      ? issueType as ClicheSymptomType
      : symptomTypes[0] || 'cliche_language'; // Fallback

    // Get source bundle from SmartSourceSelector
    const bundle = this.smartSourceSelector.selectForIssue(
      { symptom_type: symptomType },
      collegeId || 'stanford', // Default to stanford if no college
      { max_sources: 3, min_relevance_score: 40 },
      essayType
    );

    // Convert SourceBundle to SelectedCitation[] format
    return this.convertBundleToCitations(bundle, category);
  }

  /**
   * Convert a SourceBundle from SmartSourceSelector to SelectedCitation[] format.
   * This bridges the new deep research system with the existing citation display system.
   */
  private convertBundleToCitations(
    bundle: SourceBundle,
    category: DeepResearchCategory
  ): SelectedCitation[] {
    const citations: SelectedCitation[] = [];

    // Add primary source if available
    if (bundle.primary) {
      citations.push(this.convertLabeledSourceToCitation(bundle.primary, category, 'primary'));
    }

    // Add supporting sources
    for (const source of bundle.supporting || []) {
      citations.push(this.convertLabeledSourceToCitation(source, category, 'supporting'));
    }

    // Add college-specific source if different from primary
    if (bundle.college_specific && bundle.college_specific.id !== bundle.primary?.id) {
      citations.push(this.convertLabeledSourceToCitation(bundle.college_specific, category, 'college_specific'));
    }

    return citations;
  }

  /**
   * Convert a single LabeledSource to SelectedCitation format.
   */
  private convertLabeledSourceToCitation(
    source: import('../types/labeledSourceTypes').LabeledSource,
    category: DeepResearchCategory,
    role: 'primary' | 'supporting' | 'college_specific'
  ): SelectedCitation {
    // Determine citation type based on source metadata
    const citationType = source.author?.includes('Dean') || source.author?.includes('Director')
      ? 'dean_quote'
      : source.source_type === 'research_study' || source.source_type === 'neuroscience'
        ? 'internal_analysis'
        : 'dean_quote'; // Default to dean_quote for authority

    return {
      citation: {
        type: citationType,
        author: source.author,
        author_title: source.author_title || source.source_type || 'Admissions Expert',
        quote: source.quote,
        finding: source.quote,
        publication: source.publication || source.college || 'Admissions Research',
        date: source.year?.toString() || '2024',
        title: `${this.formatCategoryName(category)} Research`,
      },
      relevance: {
        score: 85,
        reason: `Research-backed guidance on ${this.formatCategoryName(category)} from ${source.author || 'admissions expert'}`,
        matches: [category, role],
      },
      presentation: {
        simplified_version: source.quote.length > 100
          ? source.quote.substring(0, 97) + '...'
          : source.quote,
        full_version: this.buildFullPresentation(source, category),
      },
    };
  }

  /**
   * Build the full presentation text for a deep research source.
   */
  private buildFullPresentation(
    source: import('../types/labeledSourceTypes').LabeledSource,
    category: DeepResearchCategory
  ): string {
    const parts: string[] = [];

    // Author attribution
    if (source.author) {
      const title = source.author_title || source.source_type || 'Admissions Expert';
      parts.push(`**${source.author}** (${title})`);
    }

    // The quote
    parts.push(`\n"${source.quote}"`);

    // Category context
    parts.push(`\n*Category: ${this.formatCategoryName(category)}*`);

    // Teaching implication
    if (source.teaching_implication) {
      parts.push(`\n**Teaching takeaway:** ${source.teaching_implication}`);
    }

    // Source details
    if (source.publication && source.year) {
      parts.push(`\n\nSource: ${source.publication}, ${source.year}`);
    } else if (source.college) {
      parts.push(`\n\nFrom: ${source.college} admissions insights`);
    }

    return parts.join('');
  }

  /**
   * Format category name for display.
   */
  private formatCategoryName(category: DeepResearchCategory): string {
    const names: Record<DeepResearchCategory, string> = {
      show_dont_tell: 'Show Don\'t Tell',
      emotional_intelligence: 'Emotional Intelligence',
      intellectual_depth: 'Intellectual Depth',
      prose_quality: 'Prose Quality & Voice',
      opening_hook: 'Essay Openings',
      essay_endings: 'Essay Endings & Conclusions',
    };
    return names[category] || category;
  }

  // ==========================================================================
  // CITATION DISPLAY FORMATTING
  // ==========================================================================

  /**
   * Format citation for frontend display
   * Simplified: Just the quote and source info
   */
  private formatCitationDisplay(
    number: number,
    citation: SelectedCitation
  ): CitationDisplayData {
    const source = citation.citation;

    return {
      number,
      quote: source.quote || source.finding || citation.presentation.simplified_version,
      source: {
        author: source.author || 'Admissions Expert',
        title: source.author_title || this.inferAuthorTitle(source),
        publication: source.publication || 'Admissions Research',
        url: source.url,
        year: source.date,
      },
      relevance: citation.relevance.reason,
      citation,
    };
  }

  /**
   * Infer author title from source type
   */
  private inferAuthorTitle(source: SelectedCitation['citation']): string {
    switch (source.type) {
      case 'dean_quote':
        return 'Dean of Admissions';
      case 'cds':
        return 'Common Data Set';
      case 'internal_analysis':
        return 'Research Analysis';
      default:
        return 'Admissions Expert';
    }
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
export async function attachCitationsToFeedback(
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
): Promise<FeedbackWithCitations> {
  // Dynamic import to avoid circular dependency (ESM compatible)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const CitationTriggerDetectorModule = await import('./citationTriggerDetector');
  const CitationTriggerDetector = CitationTriggerDetectorModule.CitationTriggerDetector;

  const detector = new CitationTriggerDetector();
  const attacher = new CitationAttacher();

  // Step 1: Detect triggers
  const triggers = detector.detectTriggers(feedback, context);

  // Step 2: Attach citations
  return attacher.attachCitations(feedback, triggers, context);
}

// CitationAttacher already exported at class declaration
