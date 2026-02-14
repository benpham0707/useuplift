// @ts-nocheck
/**
 * Citation Processor Service
 *
 * Core service for parsing, validating, and enriching citations in teaching output.
 *
 * **Responsibilities**:
 * 1. **Parse**: Extract citation markers from text into structured format
 * 2. **Validate**: Ensure all citation IDs resolve and citations are complete
 * 3. **Enrich**: Add full research context from college database
 * 4. **Format**: Convert citations to UI-ready format for tooltips
 *
 * **Citation Format**:
 * Text: "Stanford values [self-directed exploration]{{cite_1}}"
 * Citation: { id: "cite_1", type: "value", source: {...}, evidence: {...} }
 *
 * **Usage**:
 * ```typescript
 * const processor = new CitationProcessor();
 *
 * // Parse text with citations
 * const parsed = processor.parseTextWithCitations(text, citations);
 *
 * // Validate all citations resolve
 * const validation = processor.validateCitations(text, citations);
 *
 * // Enrich with research data
 * const enriched = processor.enrichCitation(citation, research);
 * ```
 */

import type {
  Citation,
  CitationDatabase,
  TextWithCitations,
  ParsedText,
  ParsedTextSpan,
  CitationValidationResult,
  CitationValidationError,
  CitationValidationWarning,
  EnrichedCitation,
  EnrichmentOptions,
  ParseOptions,
  CollegeResearch,
} from '../types';

// ============================================================================
// CITATION PROCESSOR SERVICE
// ============================================================================

export class CitationProcessor {
  /**
   * Parse text with citation markers into structured format
   *
   * Takes text like: "Stanford values [self-directed exploration]{{cite_1}}"
   * Returns array of spans: [
   *   { text: "Stanford values ", citation_id: null },
   *   { text: "self-directed exploration", citation_id: "cite_1" }
   * ]
   *
   * @param text - Text with embedded citation markers
   * @param citations - Citation database (for validation if options.validate = true)
   * @param options - Parsing options
   * @returns Parsed text with spans
   */
  public parseTextWithCitations(
    text: TextWithCitations,
    citations: CitationDatabase,
    options: ParseOptions = {}
  ): ParsedText {
    const {
      validate = true,
      throw_on_error = false,
      include_positions = true,
    } = options;

    // Regular expression to match citation markers: [text]{{cite_N}}
    // Captures: [1] = cited text, [2] = citation ID
    const citationRegex = /\[([^\]]+)\]\{\{([^}]+)\}\}/g;

    const spans: ParsedTextSpan[] = [];
    const citation_ids: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    // Extract all citation markers
    while ((match = citationRegex.exec(text)) !== null) {
      const [fullMatch, citedText, citationId] = match;
      const matchStart = match.index;

      // Add non-cited text before this citation (if any)
      if (matchStart > lastIndex) {
        const nonCitedText = text.substring(lastIndex, matchStart);
        spans.push({
          text: nonCitedText,
          citation_id: null,
          start_pos: lastIndex,
          end_pos: matchStart,
        });
      }

      // Add cited text span
      spans.push({
        text: citedText,
        citation_id: citationId,
        start_pos: matchStart,
        end_pos: matchStart + fullMatch.length,
      });

      citation_ids.push(citationId);
      lastIndex = matchStart + fullMatch.length;
    }

    // Add remaining non-cited text (if any)
    if (lastIndex < text.length) {
      spans.push({
        text: text.substring(lastIndex),
        citation_id: null,
        start_pos: lastIndex,
        end_pos: text.length,
      });
    }

    // Generate plain text (remove citation markers)
    const plain_text = text.replace(/\[([^\]]+)\]\{\{[^}]+\}\}/g, '$1');

    // Validate if requested
    if (validate) {
      const validation = this.validateCitations(text, citations);
      if (!validation.valid && throw_on_error) {
        throw new Error(
          `Citation validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }
    }

    return {
      original: text,
      spans: include_positions
        ? spans
        : spans.map(s => ({ ...s, start_pos: 0, end_pos: 0 })),
      citation_ids,
      plain_text,
    };
  }

  /**
   * Extract citation IDs from text
   *
   * Quick utility to get all citation IDs without full parsing
   *
   * @param text - Text with citation markers
   * @returns Array of citation IDs found
   */
  public extractCitationIds(text: TextWithCitations): string[] {
    const citationRegex = /\[([^\]]+)\]\{\{([^}]+)\}\}/g;
    const ids: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = citationRegex.exec(text)) !== null) {
      ids.push(match[2]); // citation ID is capture group 2
    }

    return ids;
  }

  /**
   * Validate that all citations in text resolve correctly
   *
   * Checks:
   * 1. All citation IDs in text exist in database
   * 2. All citations have required fields
   * 3. Citation markers are well-formed
   *
   * Also produces warnings for:
   * - Unused citations (in database but not in text)
   * - Duplicate citations (same ID used multiple times)
   * - Missing optional metadata
   *
   * @param text - Text with citation markers
   * @param citations - Citation database
   * @returns Validation result with errors and warnings
   */
  public validateCitations(
    text: TextWithCitations,
    citations: CitationDatabase
  ): CitationValidationResult {
    const errors: CitationValidationError[] = [];
    const warnings: CitationValidationWarning[] = [];

    // Extract all citation IDs from text
    const citationIdsInText = this.extractCitationIds(text);
    const uniqueCitationIds = new Set(citationIdsInText);

    // Check for duplicate citations (warning, not error)
    if (citationIdsInText.length !== uniqueCitationIds.size) {
      const duplicates = citationIdsInText.filter(
        (id, index) => citationIdsInText.indexOf(id) !== index
      );
      const uniqueDuplicates = [...new Set(duplicates)];

      uniqueDuplicates.forEach(id => {
        warnings.push({
          type: 'duplicate_citation',
          message: `Citation "${id}" is used multiple times in text (this is OK but notable)`,
          citation_id: id,
        });
      });
    }

    // Check each citation ID in text resolves to citation in database
    uniqueCitationIds.forEach(citationId => {
      if (!citations.citations[citationId]) {
        // Find the text where this citation appears for better error message
        const regex = new RegExp(`\\[([^\\]]+)\\]\\{\\{${citationId}\\}\\}`, 'g');
        const match = regex.exec(text);

        errors.push({
          type: 'missing_citation',
          message: `Citation ID "${citationId}" found in text but not in citation database`,
          location: match
            ? { text: match[1], position: match.index }
            : undefined,
          citation_id: citationId,
        });
      }
    });

    // Check each citation in database for completeness
    Object.entries(citations.citations).forEach(([citationId, citation]) => {
      // Check required fields
      if (!citation.id) {
        errors.push({
          type: 'missing_required_field',
          message: `Citation "${citationId}" is missing required field: id`,
          citation_id: citationId,
        });
      }

      if (!citation.type) {
        errors.push({
          type: 'missing_required_field',
          message: `Citation "${citationId}" is missing required field: type`,
          citation_id: citationId,
        });
      }

      if (!citation.source || !citation.source.name) {
        errors.push({
          type: 'missing_required_field',
          message: `Citation "${citationId}" is missing required field: source.name`,
          citation_id: citationId,
        });
      }

      if (!citation.why_relevant) {
        errors.push({
          type: 'missing_required_field',
          message: `Citation "${citationId}" is missing required field: why_relevant`,
          citation_id: citationId,
        });
      }

      // Check for unused citations (warning)
      if (!uniqueCitationIds.has(citationId)) {
        warnings.push({
          type: 'unused_citation',
          message: `Citation "${citationId}" exists in database but is not used in text`,
          citation_id: citationId,
        });
      }

      // Check for optional metadata (warnings)
      if (!citation.research_id) {
        warnings.push({
          type: 'missing_metadata',
          message: `Citation "${citationId}" is missing optional field: research_id (makes enrichment harder)`,
          citation_id: citationId,
        });
      }

      if (!citation.source.title) {
        warnings.push({
          type: 'missing_metadata',
          message: `Citation "${citationId}" is missing optional field: source.title`,
          citation_id: citationId,
        });
      }

      // Type-specific validation
      this.validateCitationTypeSpecific(citation, citationId, errors);
    });

    // Check for malformed citation markers in text
    const malformedRegex = /\[([^\]]*)\]\{\{([^}]*)\}\}/g;
    let match: RegExpExecArray | null;

    while ((match = malformedRegex.exec(text)) !== null) {
      const [, citedText, citationId] = match;

      // Check for empty citation ID
      if (!citationId || citationId.trim() === '') {
        errors.push({
          type: 'invalid_format',
          message: `Malformed citation marker: empty citation ID for text "${citedText}"`,
          location: { text: citedText, position: match.index },
        });
      }

      // Check for empty cited text
      if (!citedText || citedText.trim() === '') {
        errors.push({
          type: 'invalid_format',
          message: `Malformed citation marker: empty cited text for citation "${citationId}"`,
          location: { text: citedText, position: match.index },
          citation_id: citationId,
        });
      }
    }

    return {
      valid: errors.length === 0,
      total_citations: Object.keys(citations.citations).length,
      total_cited: uniqueCitationIds.size,
      errors,
      warnings,
    };
  }

  /**
   * Validate type-specific fields for a citation - HOLISTIC 3-TYPE SYSTEM
   * @private
   */
  private validateCitationTypeSpecific(
    citation: Citation,
    citationId: string,
    errors: CitationValidationError[]
  ): void {
    switch (citation.type) {
      case 'problem':
        // Problem citation validation
        if (!citation.evidence.problem_id) {
          errors.push({
            type: 'missing_required_field',
            message: `Problem citation "${citationId}" is missing evidence.problem_id`,
            citation_id: citationId,
          });
        }
        if (!citation.evidence.problem_name) {
          errors.push({
            type: 'missing_required_field',
            message: `Problem citation "${citationId}" is missing evidence.problem_name`,
            citation_id: citationId,
          });
        }
        if (!citation.evidence.severity) {
          errors.push({
            type: 'missing_required_field',
            message: `Problem citation "${citationId}" is missing evidence.severity`,
            citation_id: citationId,
          });
        }
        if (!citation.evidence.what_triggered_it) {
          errors.push({
            type: 'missing_required_field',
            message: `Problem citation "${citationId}" is missing evidence.what_triggered_it`,
            citation_id: citationId,
          });
        }
        if (!citation.evidence.why_matters) {
          errors.push({
            type: 'missing_required_field',
            message: `Problem citation "${citationId}" is missing evidence.why_matters`,
            citation_id: citationId,
          });
        }
        if (!citation.evidence.score_impact) {
          errors.push({
            type: 'missing_required_field',
            message: `Problem citation "${citationId}" is missing evidence.score_impact`,
            citation_id: citationId,
          });
        }
        break;

      case 'strength':
        // Strength citation validation (consolidates green_flag + value)
        if (!citation.evidence.strength_id) {
          errors.push({
            type: 'missing_required_field',
            message: `Strength citation "${citationId}" is missing evidence.strength_id`,
            citation_id: citationId,
          });
        }
        if (!citation.evidence.strength_name) {
          errors.push({
            type: 'missing_required_field',
            message: `Strength citation "${citationId}" is missing evidence.strength_name`,
            citation_id: citationId,
          });
        }
        if (!citation.evidence.strength_type) {
          errors.push({
            type: 'missing_required_field',
            message: `Strength citation "${citationId}" is missing evidence.strength_type`,
            citation_id: citationId,
          });
        }
        if (!citation.evidence.what_demonstrates_it) {
          errors.push({
            type: 'missing_required_field',
            message: `Strength citation "${citationId}" is missing evidence.what_demonstrates_it`,
            citation_id: citationId,
          });
        }
        if (!citation.evidence.why_valued) {
          errors.push({
            type: 'missing_required_field',
            message: `Strength citation "${citationId}" is missing evidence.why_valued`,
            citation_id: citationId,
          });
        }
        if (!citation.evidence.score_impact) {
          errors.push({
            type: 'missing_required_field',
            message: `Strength citation "${citationId}" is missing evidence.score_impact`,
            citation_id: citationId,
          });
        }
        break;

      case 'teaching':
        // Teaching citation validation (consolidates quote + example)
        if (!citation.evidence.teaching_type) {
          errors.push({
            type: 'missing_required_field',
            message: `Teaching citation "${citationId}" is missing evidence.teaching_type`,
            citation_id: citationId,
          });
        }
        if (!citation.evidence.technique) {
          errors.push({
            type: 'missing_required_field',
            message: `Teaching citation "${citationId}" is missing evidence.technique`,
            citation_id: citationId,
          });
        }

        // Validate based on teaching_type
        if (citation.evidence.teaching_type === 'elite_technique') {
          if (!citation.evidence.example_id) {
            errors.push({
              type: 'missing_required_field',
              message: `Elite technique citation "${citationId}" is missing evidence.example_id`,
              citation_id: citationId,
            });
          }
        } else if (citation.evidence.teaching_type === 'dean_quote') {
          if (!citation.evidence.dean_quote) {
            errors.push({
              type: 'missing_required_field',
              message: `Dean quote citation "${citationId}" is missing evidence.dean_quote`,
              citation_id: citationId,
            });
          }
        }
        break;
    }
  }

  /**
   * Enrich citation with full research database context
   *
   * Takes a basic citation and adds:
   * - Full evidence from research database
   * - Related citations
   * - Additional context
   *
   * @param citation - Basic citation to enrich
   * @param research - College research database
   * @param options - Enrichment options
   * @returns Enriched citation with full context
   */
  public enrichCitation(
    citation: Citation,
    research: CollegeResearch,
    options: EnrichmentOptions = { college_id: '' }
  ): EnrichedCitation {
    const enriched: EnrichedCitation = {
      ...citation,
      research_context: {
        college_id: options.college_id,
        prompt_id: options.prompt_id,
      },
      enrichment: {
        enriched_at: new Date().toISOString(),
        success: false,
        warnings: [],
      },
    };

    try {
      // Enrich based on citation type
      switch (citation.type) {
        case 'quote':
          this.enrichQuoteCitation(enriched, research, options);
          break;

        case 'red_flag':
          this.enrichRedFlagCitation(enriched, research, options);
          break;

        case 'green_flag':
          this.enrichGreenFlagCitation(enriched, research, options);
          break;

        case 'value':
          this.enrichValueCitation(enriched, research, options);
          break;

        case 'example':
          this.enrichExampleCitation(enriched, research, options);
          break;
      }

      // Find related citations if requested
      if (options.include_related) {
        enriched.research_context!.related_citations =
          this.findRelatedCitations(citation, research);
      }

      enriched.enrichment!.success = true;
    } catch (error) {
      enriched.enrichment!.success = false;
      enriched.enrichment!.warnings = [
        `Failed to enrich citation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      ];
    }

    return enriched;
  }

  /**
   * Enrich quote citation with full quote context
   * @private
   */
  private enrichQuoteCitation(
    enriched: EnrichedCitation,
    research: CollegeResearch,
    options: EnrichmentOptions
  ): void {
    if (enriched.type !== 'quote') return;

    // Try to find the full quote in research database
    const matchingQuote = research.keyQuotes.find(
      q => q.quoteId === enriched.research_id
    );

    if (matchingQuote) {
      // Add full quote if citation has abbreviated version
      if (!enriched.evidence.full_quote) {
        enriched.evidence.full_quote = matchingQuote.quote;
      }

      // Enrich source information
      if (matchingQuote.source.publication) {
        enriched.source.publication = matchingQuote.source.publication;
      }
      if (matchingQuote.source.date) {
        enriched.source.date = matchingQuote.source.date;
      }

      // Add all evidence from research
      enriched.research_context!.all_evidence = [
        matchingQuote.quote,
        matchingQuote.context,
        matchingQuote.insight,
        matchingQuote.teachingApplication,
      ];
    } else if (options.validate_research_id) {
      enriched.enrichment!.warnings!.push(
        `Quote research_id "${enriched.research_id}" not found in research database`
      );
    }
  }

  /**
   * Enrich red flag citation with full flag context
   * @private
   */
  private enrichRedFlagCitation(
    enriched: EnrichedCitation,
    research: CollegeResearch,
    options: EnrichmentOptions
  ): void {
    if (enriched.type !== 'red_flag') return;

    const matchingFlag = research.redFlags.find(
      f => f.flagId === enriched.evidence.flag_id
    );

    if (matchingFlag) {
      // Add comprehensive evidence
      enriched.research_context!.all_evidence = [
        matchingFlag.detection.description,
        matchingFlag.teaching.problem,
        matchingFlag.teaching.whyItMatters,
        matchingFlag.teaching.howToFix,
      ];

      // Add example fix if available
      if (matchingFlag.teaching.exampleFix) {
        enriched.research_context!.all_evidence.push(
          matchingFlag.teaching.exampleFix
        );
      }
    } else if (options.validate_research_id) {
      enriched.enrichment!.warnings!.push(
        `Red flag "${enriched.evidence.flag_id}" not found in research database`
      );
    }
  }

  /**
   * Enrich green flag citation with full flag context
   * @private
   */
  private enrichGreenFlagCitation(
    enriched: EnrichedCitation,
    research: CollegeResearch,
    options: EnrichmentOptions
  ): void {
    if (enriched.type !== 'green_flag') return;

    const matchingFlag = research.greenFlags.find(
      f => f.flagId === enriched.evidence.flag_id
    );

    if (matchingFlag) {
      enriched.research_context!.all_evidence = [
        matchingFlag.detection.description,
        matchingFlag.teaching.whatWorks,
        matchingFlag.teaching.whyItMatters,
        matchingFlag.teaching.howToEnhance,
      ];
    } else if (options.validate_research_id) {
      enriched.enrichment!.warnings!.push(
        `Green flag "${enriched.evidence.flag_id}" not found in research database`
      );
    }
  }

  /**
   * Enrich value citation with full value context
   * @private
   */
  private enrichValueCitation(
    enriched: EnrichedCitation,
    research: CollegeResearch,
    options: EnrichmentOptions
  ): void {
    if (enriched.type !== 'value') return;

    const matchingValue = research.coreValues.find(
      v => v.valueId === enriched.evidence.value_id
    );

    if (matchingValue) {
      // Add weight if not present
      if (!enriched.evidence.weight) {
        enriched.evidence.weight = matchingValue.weight;
      }

      // Add definition if not present
      if (!enriched.evidence.definition) {
        enriched.evidence.definition = matchingValue.definition;
      }

      enriched.research_context!.all_evidence = [
        matchingValue.definition,
        matchingValue.essayImplication,
        ...matchingValue.is,
        ...matchingValue.isNot,
      ];
    } else if (options.validate_research_id) {
      enriched.enrichment!.warnings!.push(
        `Value "${enriched.evidence.value_id}" not found in research database`
      );
    }
  }

  /**
   * Enrich example citation with full example context
   * @private
   */
  private enrichExampleCitation(
    enriched: EnrichedCitation,
    research: CollegeResearch,
    options: EnrichmentOptions
  ): void {
    if (enriched.type !== 'example') return;

    const matchingExample = research.eliteExamples.find(
      ex => ex.exampleId === enriched.evidence.example_id
    );

    if (matchingExample) {
      // Add score if not present
      if (!enriched.evidence.score) {
        enriched.evidence.score = matchingExample.quality.score;
      }

      enriched.research_context!.all_evidence = [
        ...matchingExample.demonstrates,
        ...matchingExample.teachableTechniques.map(t => t.howItWorks),
      ];
    } else if (options.validate_research_id) {
      enriched.enrichment!.warnings!.push(
        `Example "${enriched.evidence.example_id}" not found in research database`
      );
    }
  }

  /**
   * Find related citations for cross-referencing
   * @private
   */
  private findRelatedCitations(
    citation: Citation,
    research: CollegeResearch
  ): string[] {
    const related: string[] = [];

    // This is a placeholder implementation
    // In a full implementation, this would use semantic similarity
    // or explicit relationship mappings in the research database

    // For now, return empty array
    return related;
  }

  /**
   * Create a citation database with metadata
   *
   * Helper to create properly structured citation database from raw citations
   *
   * @param citations - Record of citation_id → Citation
   * @returns CitationDatabase with metadata
   */
  public createCitationDatabase(
    citations: Record<string, Citation>
  ): CitationDatabase {
    const byType: Record<string, number> = {
      quote: 0,
      red_flag: 0,
      green_flag: 0,
      value: 0,
      example: 0,
    };

    Object.values(citations).forEach(citation => {
      byType[citation.type] = (byType[citation.type] || 0) + 1;
    });

    return {
      citations,
      metadata: {
        total_count: Object.keys(citations).length,
        by_type: byType as Record<typeof citation.type, number>,
        generated_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Remove citation markers from text
   *
   * Converts: "Stanford values [self-directed exploration]{{cite_1}}"
   * To: "Stanford values self-directed exploration"
   *
   * @param text - Text with citation markers
   * @returns Plain text with markers removed
   */
  public stripCitationMarkers(text: TextWithCitations): string {
    return text.replace(/\[([^\]]+)\]\{\{[^}]+\}\}/g, '$1');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const citationProcessor = new CitationProcessor();
