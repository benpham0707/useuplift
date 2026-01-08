/**
 * Smart Source Selector
 *
 * Intelligent source selection with:
 * - College-specific prioritization
 * - Multi-source bundles
 * - Diversity requirements
 * - Pre-formatted output
 *
 * This is the primary interface for selecting sources throughout the system.
 */

import type {
  LabeledSource,
  SourceBundle,
  SourceSelectionOptions,
  ClicheSymptomType,
  CollegeId,
  TeachingMomentType,
} from '../types/labeledSourceTypes';
import { DEFAULT_SELECTION_OPTIONS } from '../types/labeledSourceTypes';
import { SourceIndexer, getSourceIndexer, IndexedSource } from './sourceIndexer';
import type { CriticalIssue } from './stage1BDiagnosisService';

// ============================================================================
// SMART SOURCE SELECTOR
// ============================================================================

export class SmartSourceSelector {
  private indexer: SourceIndexer;

  constructor(indexer?: SourceIndexer) {
    this.indexer = indexer || getSourceIndexer();
  }

  // ============================================================================
  // MAIN SELECTION METHODS
  // ============================================================================

  /**
   * Select best sources for an issue + college combination
   * Returns a complete SourceBundle with primary, supporting, and formatted output
   */
  selectForIssue(
    issue: CriticalIssue | { symptom_type: string },
    collegeId: CollegeId,
    options: Partial<SourceSelectionOptions> = {}
  ): SourceBundle {
    const opts = { ...DEFAULT_SELECTION_OPTIONS, ...options };
    const issueType = issue.symptom_type as ClicheSymptomType;

    // Get candidates from index
    const candidates = this.indexer.getBestForCollegeAndIssue(
      collegeId,
      issueType,
      opts.max_sources * 2 // Get extra for diversity filtering
    );

    if (candidates.length === 0) {
      // Fallback to any sources for this issue type
      const fallbackCandidates = this.indexer.getTopForIssueType(
        issueType,
        opts.max_sources,
        opts.min_relevance_score
      );
      return this.buildBundle(fallbackCandidates, collegeId, issueType, opts);
    }

    return this.buildBundle(candidates, collegeId, issueType, opts);
  }

  /**
   * Select sources for a specific teaching moment
   */
  selectForTeaching(
    moment: TeachingMomentType,
    collegeId: CollegeId,
    options: Partial<SourceSelectionOptions> = {}
  ): SourceBundle {
    const opts = { ...DEFAULT_SELECTION_OPTIONS, ...options };

    // Get sources for this teaching moment
    let candidates = this.indexer.getForTeachingMoment(moment);

    // Filter by college applicability
    candidates = candidates.filter(s => s.applies_to_colleges.has(collegeId));

    // Apply diversity if needed
    if (opts.require_author_diversity) {
      candidates = this.ensureAuthorDiversity(candidates, opts.max_same_author);
    }

    return this.buildBundle(candidates.slice(0, opts.max_sources), collegeId, undefined, opts);
  }

  /**
   * Select sources specifically for proving weight claims
   */
  selectForWeightProof(
    valueId: string,
    collegeId: CollegeId,
    options: Partial<SourceSelectionOptions> = {}
  ): SourceBundle {
    const opts = { ...DEFAULT_SELECTION_OPTIONS, ...options };

    // Get sources for 'proving_weight' usage context
    let candidates = this.indexer.getForUsageContext('proving_weight');

    // Prioritize college-specific sources
    const collegePrimary = candidates.filter(s =>
      s.is_primary_for_college === collegeId
    );

    const collegeApplicable = candidates.filter(s =>
      s.applies_to_colleges.has(collegeId) && s.is_primary_for_college !== collegeId
    );

    // Combine with college primary first
    const sorted = [...collegePrimary, ...collegeApplicable];

    return this.buildBundle(sorted.slice(0, opts.max_sources), collegeId, undefined, opts);
  }

  /**
   * Get the single best source for a quick lookup
   * Use this when you only need one source
   */
  getBestSingle(
    issueType: ClicheSymptomType,
    collegeId?: CollegeId
  ): LabeledSource | null {
    if (collegeId) {
      // Get college-specific first
      const collegePrimary = this.indexer.getPrimaryForCollege(collegeId);
      if (collegePrimary && collegePrimary.relevance_lookup.has(issueType)) {
        return collegePrimary.source;
      }

      // Fall back to best for issue that applies to this college
      const candidates = this.indexer.getBestForCollegeAndIssue(collegeId, issueType, 1);
      return candidates[0]?.source || null;
    }

    // No college specified - get best for issue type
    const candidates = this.indexer.getTopForIssueType(issueType, 1);
    return candidates[0]?.source || null;
  }

  // ============================================================================
  // BUNDLE BUILDING
  // ============================================================================

  private buildBundle(
    candidates: IndexedSource[],
    collegeId: CollegeId,
    issueType?: ClicheSymptomType,
    options: Required<SourceSelectionOptions> = DEFAULT_SELECTION_OPTIONS
  ): SourceBundle {
    // Apply diversity requirements
    let selected = this.applyDiversityRequirements(candidates, options);

    // Ensure minimum sources
    if (selected.length === 0) {
      // Emergency fallback - get any sources
      selected = this.indexer.getAll().slice(0, 3);
    }

    // Identify roles
    const primary = selected[0];
    const supporting = selected.slice(1, Math.min(4, selected.length));

    // Find college-specific source
    const collegeSpecific = selected.find(s =>
      s.is_primary_for_college === collegeId
    ) || null;

    // Find general principle source (not college-specific)
    const generalPrinciple = selected.find(s =>
      s.is_primary_for_college === null ||
      s.is_primary_for_college !== collegeId
    ) || null;

    // Calculate diversity score
    const diversityScore = this.calculateDiversityScore(selected);

    return {
      primary: primary.source,
      supporting: supporting.map(s => s.source),
      college_specific: collegeSpecific?.source || null,
      general_principle: generalPrinciple?.source || null,
      formatted: {
        inline: this.formatInline(primary.source),
        tooltip: this.formatTooltip(primary.source),
        full: this.formatFull(selected.map(s => s.source)),
      },
      metadata: {
        total_candidates: candidates.length,
        selection_criteria: this.buildSelectionCriteria(collegeId, issueType, options),
        diversity_score: diversityScore,
      },
    };
  }

  // ============================================================================
  // DIVERSITY HANDLING
  // ============================================================================

  private applyDiversityRequirements(
    candidates: IndexedSource[],
    options: Required<SourceSelectionOptions>
  ): IndexedSource[] {
    const selected: IndexedSource[] = [];
    const authorCounts = new Map<string, number>();
    const institutionsSeen = new Set<string>();

    for (const candidate of candidates) {
      const author = candidate.source.author || 'Unknown';
      const institution = candidate.is_primary_for_college || 'general';

      // Author diversity - allow reasonable repetition while ensuring variety
      // The max_same_author setting (default 2) allows some repetition for authoritative voices
      if (options.require_author_diversity) {
        const currentCount = authorCounts.get(author) || 0;
        if (currentCount >= options.max_same_author) {
          continue; // Skip this source - author limit reached
        }
      }

      // Check institution diversity
      if (
        options.require_institution_diversity &&
        institutionsSeen.has(institution) &&
        selected.length >= 2
      ) {
        // Allow one repeat institution, but prefer diversity
        const sameInstitutionCount = selected.filter(s =>
          (s.is_primary_for_college || 'general') === institution
        ).length;
        if (sameInstitutionCount >= 2) {
          continue;
        }
      }

      selected.push(candidate);
      authorCounts.set(author, (authorCounts.get(author) || 0) + 1);
      institutionsSeen.add(institution);

      if (selected.length >= options.max_sources) {
        break;
      }
    }

    return selected;
  }

  private ensureAuthorDiversity(
    sources: IndexedSource[],
    maxSameAuthor: number
  ): IndexedSource[] {
    const result: IndexedSource[] = [];
    const authorCounts = new Map<string, number>();

    for (const source of sources) {
      const author = source.source.author || 'Unknown';
      const count = authorCounts.get(author) || 0;
      if (count < maxSameAuthor) {
        result.push(source);
        authorCounts.set(author, count + 1);
      }
    }

    return result;
  }

  private calculateDiversityScore(sources: IndexedSource[]): number {
    if (sources.length <= 1) return 100;

    const authors = new Set(sources.map(s => s.source.author));
    const institutions = new Set(sources.map(s => s.is_primary_for_college || 'general'));

    // Score based on unique authors and institutions
    const authorDiversity = (authors.size / sources.length) * 100;
    const institutionDiversity = (institutions.size / sources.length) * 100;

    return Math.round((authorDiversity + institutionDiversity) / 2);
  }

  // ============================================================================
  // FORMATTING
  // ============================================================================

  /**
   * Format source for inline embedding in text
   */
  formatInline(source: LabeledSource): string {
    if (source.author && source.author_title) {
      return `(${source.author}, ${source.author_title})`;
    }
    return `(${source.author || source.publication || 'Admissions Expert'})`;
  }

  /**
   * Format source for tooltip/hover display
   */
  formatTooltip(source: LabeledSource): string {
    const lines: string[] = [];

    if (source.author) {
      lines.push(`**${source.author}**`);
      if (source.author_title) {
        lines.push(source.author_title);
      }
    }

    if (source.quote) {
      lines.push(`\n"${source.quote}"`);
    }

    if (source.publication && source.date) {
      const year = source.date.split('-')[0];
      lines.push(`\n— ${source.publication}, ${year}`);
    }

    return lines.join('\n');
  }

  /**
   * Format multiple sources for full display
   */
  formatFull(sources: LabeledSource[]): string {
    return sources.map((source, index) => {
      const lines: string[] = [];

      lines.push(`### Source ${index + 1}: ${source.title || 'Admissions Insight'}`);

      if (source.author && source.author_title) {
        lines.push(`**${source.author}**, ${source.author_title}`);
      }

      if (source.quote) {
        lines.push(`\n> "${source.quote}"`);
      }

      if (source.publication && source.date) {
        const year = source.date.split('-')[0];
        lines.push(`\n*${source.publication}*, ${year}`);
      }

      if (source.relevance_to_claim) {
        lines.push(`\n**Why this matters:** ${source.relevance_to_claim}`);
      }

      return lines.join('\n');
    }).join('\n\n---\n\n');
  }

  // ============================================================================
  // METADATA
  // ============================================================================

  private buildSelectionCriteria(
    collegeId: CollegeId,
    issueType?: ClicheSymptomType,
    options?: Required<SourceSelectionOptions>
  ): string[] {
    const criteria: string[] = [];

    criteria.push(`College: ${collegeId}`);
    if (issueType) {
      criteria.push(`Issue type: ${issueType}`);
    }
    if (options?.prioritize_college_specific) {
      criteria.push('College-specific sources prioritized');
    }
    if (options?.require_author_diversity) {
      criteria.push(`Max ${options.max_same_author} sources per author`);
    }
    if (options?.require_institution_diversity) {
      criteria.push('Institution diversity required');
    }

    return criteria;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get all sources for a college (for displaying attribution)
   */
  getAllForCollege(collegeId: CollegeId): LabeledSource[] {
    return this.indexer.getForCollege(collegeId).map(s => s.source);
  }

  /**
   * Check if we have good coverage for a college
   */
  hasGoodCoverage(collegeId: CollegeId): boolean {
    const sources = this.indexer.getForCollege(collegeId);
    const hasPrimary = sources.some(s => s.is_primary_for_college === collegeId);
    return hasPrimary && sources.length >= 3;
  }

  /**
   * Get statistics about source coverage
   */
  getStats(): {
    totalSources: number;
    collegesWithPrimarySources: number;
    issueTypesCovered: number;
    averageSourcesPerIssue: number;
  } {
    const indexStats = this.indexer.getStats();
    const coverageReport = this.indexer.getCoverageReport();

    let totalIssueTypeSources = 0;
    for (const count of coverageReport.values()) {
      totalIssueTypeSources += count;
    }

    return {
      totalSources: indexStats.totalSources,
      collegesWithPrimarySources: indexStats.collegesWithPrimarySources,
      issueTypesCovered: indexStats.issueTypesCovered,
      averageSourcesPerIssue: coverageReport.size > 0
        ? totalIssueTypeSources / coverageReport.size
        : 0,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let _selector: SmartSourceSelector | null = null;

/**
 * Get the singleton smart source selector
 */
export function getSmartSourceSelector(): SmartSourceSelector {
  if (!_selector) {
    _selector = new SmartSourceSelector();
  }
  return _selector;
}

/**
 * Reset the selector (for testing)
 */
export function resetSmartSourceSelector(): void {
  _selector = null;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick function to get best source for an issue
 * Use this for simple lookups
 */
export function getBestSourceForIssueOptimized(
  issueType: ClicheSymptomType,
  collegeId?: CollegeId
): LabeledSource | null {
  return getSmartSourceSelector().getBestSingle(issueType, collegeId);
}

/**
 * Quick function to get source bundle for an issue
 */
export function getSourceBundleForIssue(
  issueType: ClicheSymptomType,
  collegeId: CollegeId,
  options?: Partial<SourceSelectionOptions>
): SourceBundle {
  return getSmartSourceSelector().selectForIssue(
    { symptom_type: issueType },
    collegeId,
    options
  );
}
