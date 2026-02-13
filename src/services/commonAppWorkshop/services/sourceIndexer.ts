// @ts-nocheck
/**
 * Source Indexer
 *
 * Pre-computes indices for efficient O(1) source lookups.
 * Built once at startup, cached in memory for instant access.
 *
 * Design Goals:
 * 1. Eliminate runtime scoring computations
 * 2. Enable multi-dimensional lookups (college, issue, category)
 * 3. Support complex queries with pre-computed results
 */

import type {
  LabeledSource,
  SourceCategory,
  ClicheSymptomType,
  CollegeId,
  TeachingMomentType,
  UsageContext,
} from '../types/labeledSourceTypes';
import { COLLEGE_VALUES, COLLEGE_PEER_INSTITUTIONS } from '../types/labeledSourceTypes';
import { LABELED_SOURCES } from '../data/labeledSources';

// ============================================================================
// INDEXED SOURCE (with pre-computed scores)
// ============================================================================

export interface IndexedSource {
  source: LabeledSource;

  /** Pre-computed relevance scores for quick access */
  relevance_lookup: Map<ClicheSymptomType, number>;

  /** Pre-computed college applicability */
  applies_to_colleges: Set<CollegeId>;

  /** Is this a college-specific primary source? */
  is_primary_for_college: CollegeId | null;
}

// ============================================================================
// SOURCE INDEXER CLASS
// ============================================================================

export class SourceIndexer {
  // ---- Pre-computed indices ----
  private readonly byCollege: Map<CollegeId, IndexedSource[]> = new Map();
  private readonly byIssueType: Map<ClicheSymptomType, IndexedSource[]> = new Map();
  private readonly byCategory: Map<SourceCategory, IndexedSource[]> = new Map();
  private readonly byTeachingMoment: Map<TeachingMomentType, IndexedSource[]> = new Map();
  private readonly byUsageContext: Map<UsageContext, IndexedSource[]> = new Map();
  private readonly byAuthor: Map<string, IndexedSource[]> = new Map();

  // ---- All indexed sources ----
  private readonly allSources: IndexedSource[] = [];

  // ---- Statistics ----
  private readonly stats = {
    totalSources: 0,
    collegesWithPrimarySources: 0,
    issueTypesCovered: 0,
    categoriesCovered: 0,
    buildTimeMs: 0,
  };

  // ============================================================================
  // CONSTRUCTOR
  // ============================================================================

  constructor(sources: LabeledSource[] = LABELED_SOURCES) {
    const startTime = Date.now();

    // Index all sources
    for (const source of sources) {
      const indexed = this.indexSource(source);
      this.allSources.push(indexed);
    }

    // Build all indices
    this.buildCollegeIndex();
    this.buildIssueTypeIndex();
    this.buildCategoryIndex();
    this.buildTeachingMomentIndex();
    this.buildUsageContextIndex();
    this.buildAuthorIndex();

    // Calculate stats
    this.stats.totalSources = this.allSources.length;
    this.stats.collegesWithPrimarySources = new Set(
      this.allSources
        .map(s => s.is_primary_for_college)
        .filter((c): c is CollegeId => c !== null)
    ).size;
    this.stats.issueTypesCovered = this.byIssueType.size;
    this.stats.categoriesCovered = this.byCategory.size;
    this.stats.buildTimeMs = Date.now() - startTime;
  }

  // ============================================================================
  // INDEXING METHODS
  // ============================================================================

  private indexSource(source: LabeledSource): IndexedSource {
    // Build relevance lookup map
    const relevanceLookup = new Map<ClicheSymptomType, number>();
    for (const [issueType, data] of Object.entries(source.issue_relevance)) {
      relevanceLookup.set(issueType as ClicheSymptomType, data.score);
    }

    // Build college applicability set
    const appliesToColleges = new Set<CollegeId>(
      source.college_specificity.applicable_colleges as CollegeId[]
    );

    return {
      source,
      relevance_lookup: relevanceLookup,
      applies_to_colleges: appliesToColleges,
      is_primary_for_college: source.college_specificity.primary_college as CollegeId | null,
    };
  }

  private buildCollegeIndex(): void {
    for (const indexed of this.allSources) {
      for (const college of indexed.applies_to_colleges) {
        if (!this.byCollege.has(college)) {
          this.byCollege.set(college, []);
        }
        this.byCollege.get(college)!.push(indexed);
      }
    }

    // Sort each college's sources by authority weight
    for (const sources of this.byCollege.values()) {
      sources.sort((a, b) => {
        // Primary sources for this college first
        if (a.is_primary_for_college && !b.is_primary_for_college) return -1;
        if (!a.is_primary_for_college && b.is_primary_for_college) return 1;
        // Then by weight
        return b.source.weight_in_calculation - a.source.weight_in_calculation;
      });
    }
  }

  private buildIssueTypeIndex(): void {
    const issueTypes: ClicheSymptomType[] = [
      'cliche_metaphor',
      'telling_not_showing',
      'cliche_topic_framing',
      'cliche_narrative_arc',
      'cliche_ai_convergence',
      'cliche_essay_formula',
      'cliche_college_specific',
      'cliche_value_signaling',
      'cliche_inspirational',
      'cliche_language',
    ];

    for (const issueType of issueTypes) {
      const relevantSources = this.allSources.filter(
        s => s.relevance_lookup.has(issueType)
      );

      // Sort by relevance score for this issue type
      relevantSources.sort((a, b) => {
        const scoreA = a.relevance_lookup.get(issueType) || 0;
        const scoreB = b.relevance_lookup.get(issueType) || 0;
        return scoreB - scoreA;
      });

      this.byIssueType.set(issueType, relevantSources);
    }
  }

  private buildCategoryIndex(): void {
    for (const indexed of this.allSources) {
      // Index by primary category
      const primary = indexed.source.taxonomy.primary_category;
      if (!this.byCategory.has(primary)) {
        this.byCategory.set(primary, []);
      }
      this.byCategory.get(primary)!.push(indexed);

      // Index by secondary categories
      for (const secondary of indexed.source.taxonomy.secondary_categories) {
        if (!this.byCategory.has(secondary)) {
          this.byCategory.set(secondary, []);
        }
        this.byCategory.get(secondary)!.push(indexed);
      }
    }

    // Sort by weight
    for (const sources of this.byCategory.values()) {
      sources.sort((a, b) => b.source.weight_in_calculation - a.source.weight_in_calculation);
    }
  }

  private buildTeachingMomentIndex(): void {
    for (const indexed of this.allSources) {
      for (const moment of indexed.source.taxonomy.teaching_moment_types) {
        if (!this.byTeachingMoment.has(moment)) {
          this.byTeachingMoment.set(moment, []);
        }
        this.byTeachingMoment.get(moment)!.push(indexed);
      }
    }

    // Sort by weight
    for (const sources of this.byTeachingMoment.values()) {
      sources.sort((a, b) => b.source.weight_in_calculation - a.source.weight_in_calculation);
    }
  }

  private buildUsageContextIndex(): void {
    for (const indexed of this.allSources) {
      for (const context of indexed.source.usage.best_for) {
        if (!this.byUsageContext.has(context)) {
          this.byUsageContext.set(context, []);
        }
        this.byUsageContext.get(context)!.push(indexed);
      }
    }
  }

  private buildAuthorIndex(): void {
    for (const indexed of this.allSources) {
      const author = indexed.source.author || 'Unknown';
      if (!this.byAuthor.has(author)) {
        this.byAuthor.set(author, []);
      }
      this.byAuthor.get(author)!.push(indexed);
    }
  }

  // ============================================================================
  // LOOKUP METHODS
  // ============================================================================

  /**
   * Get all sources applicable to a college (O(1) lookup)
   */
  getForCollege(collegeId: CollegeId): IndexedSource[] {
    return this.byCollege.get(collegeId) || [];
  }

  /**
   * Get primary source for a college (O(1) lookup)
   */
  getPrimaryForCollege(collegeId: CollegeId): IndexedSource | null {
    const sources = this.byCollege.get(collegeId) || [];
    return sources.find(s => s.is_primary_for_college === collegeId) || null;
  }

  /**
   * Get all sources relevant to an issue type (O(1) lookup)
   */
  getForIssueType(issueType: ClicheSymptomType): IndexedSource[] {
    return this.byIssueType.get(issueType) || [];
  }

  /**
   * Get top sources for an issue type with minimum score
   */
  getTopForIssueType(
    issueType: ClicheSymptomType,
    limit: number = 5,
    minScore: number = 40
  ): IndexedSource[] {
    return (this.byIssueType.get(issueType) || [])
      .filter(s => (s.relevance_lookup.get(issueType) || 0) >= minScore)
      .slice(0, limit);
  }

  /**
   * Get sources for a category (O(1) lookup)
   */
  getForCategory(category: SourceCategory): IndexedSource[] {
    return this.byCategory.get(category) || [];
  }

  /**
   * Get sources for a teaching moment type
   */
  getForTeachingMoment(moment: TeachingMomentType): IndexedSource[] {
    return this.byTeachingMoment.get(moment) || [];
  }

  /**
   * Get sources for a usage context
   */
  getForUsageContext(context: UsageContext): IndexedSource[] {
    return this.byUsageContext.get(context) || [];
  }

  /**
   * Get sources by author
   */
  getByAuthor(author: string): IndexedSource[] {
    return this.byAuthor.get(author) || [];
  }

  // ============================================================================
  // COMBINED QUERIES
  // ============================================================================

  /**
   * Get best sources for a college + issue type combination
   * This is the most common query - optimized for speed
   */
  getBestForCollegeAndIssue(
    collegeId: CollegeId,
    issueType: ClicheSymptomType,
    limit: number = 5
  ): IndexedSource[] {
    // Get sources relevant to this issue
    const issueRelevant = this.byIssueType.get(issueType) || [];

    // Filter to those applicable to this college
    const collegeRelevant = issueRelevant.filter(s =>
      s.applies_to_colleges.has(collegeId)
    );

    // Score and sort
    const scored = collegeRelevant.map(s => {
      let score = s.relevance_lookup.get(issueType) || 0;

      // Boost for primary college source
      if (s.is_primary_for_college === collegeId) {
        score += 30;
      }

      // Boost for weight
      score += s.source.weight_in_calculation * 0.2;

      return { source: s, finalScore: score };
    });

    scored.sort((a, b) => b.finalScore - a.finalScore);

    return scored.slice(0, limit).map(s => s.source);
  }

  /**
   * Get diverse sources for an issue (different authors/institutions)
   */
  getDiverseForIssue(
    issueType: ClicheSymptomType,
    limit: number = 3,
    collegeId?: CollegeId
  ): IndexedSource[] {
    let candidates = this.byIssueType.get(issueType) || [];

    // Filter by college if specified
    if (collegeId) {
      candidates = candidates.filter(s =>
        s.applies_to_colleges.has(collegeId)
      );
    }

    // Select diverse sources (different authors)
    const selected: IndexedSource[] = [];
    const usedAuthors = new Set<string>();

    for (const source of candidates) {
      const author = source.source.author || 'Unknown';
      if (!usedAuthors.has(author)) {
        selected.push(source);
        usedAuthors.add(author);
        if (selected.length >= limit) break;
      }
    }

    return selected;
  }

  /**
   * Get sources matching college values
   * Falls back to peer institutions and general sources
   */
  getForCollegeValues(collegeId: CollegeId, limit: number = 5): IndexedSource[] {
    const values = COLLEGE_VALUES[collegeId] || [];
    const results: IndexedSource[] = [];
    const usedIds = new Set<string>();

    // First: sources that match college values AND are applicable
    for (const value of values) {
      const categorySources = this.byCategory.get(value) || [];
      for (const source of categorySources) {
        if (
          !usedIds.has(source.source.source_id) &&
          source.applies_to_colleges.has(collegeId)
        ) {
          results.push(source);
          usedIds.add(source.source.source_id);
          if (results.length >= limit) return results;
        }
      }
    }

    // Second: sources from peer institutions
    const peers = COLLEGE_PEER_INSTITUTIONS[collegeId] || [];
    for (const peer of peers) {
      const peerPrimary = this.getPrimaryForCollege(peer);
      if (peerPrimary && !usedIds.has(peerPrimary.source.source_id)) {
        results.push(peerPrimary);
        usedIds.add(peerPrimary.source.source_id);
        if (results.length >= limit) return results;
      }
    }

    return results;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get all indexed sources
   */
  getAll(): IndexedSource[] {
    return [...this.allSources];
  }

  /**
   * Get statistics about the index
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Check if a source exists for a college + issue combination
   */
  hasSourceFor(collegeId: CollegeId, issueType: ClicheSymptomType): boolean {
    const sources = this.byIssueType.get(issueType) || [];
    return sources.some(s => s.applies_to_colleges.has(collegeId));
  }

  /**
   * Get coverage report for all issue types
   */
  getCoverageReport(): Map<ClicheSymptomType, number> {
    const report = new Map<ClicheSymptomType, number>();
    for (const [issueType, sources] of this.byIssueType) {
      report.set(issueType, sources.length);
    }
    return report;
  }

  /**
   * Get college coverage report
   */
  getCollegeCoverage(): Map<CollegeId, { total: number; hasPrimary: boolean }> {
    const report = new Map<CollegeId, { total: number; hasPrimary: boolean }>();
    for (const [college, sources] of this.byCollege) {
      report.set(college, {
        total: sources.length,
        hasPrimary: sources.some(s => s.is_primary_for_college === college),
      });
    }
    return report;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let _indexer: SourceIndexer | null = null;

/**
 * Get the singleton source indexer instance
 * Lazy-loaded on first access
 */
export function getSourceIndexer(): SourceIndexer {
  if (!_indexer) {
    _indexer = new SourceIndexer();
  }
  return _indexer;
}

/**
 * Reset the indexer (for testing)
 */
export function resetSourceIndexer(): void {
  _indexer = null;
}
