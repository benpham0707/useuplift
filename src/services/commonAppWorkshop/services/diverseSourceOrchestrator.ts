/**
 * Diverse Source Orchestrator
 *
 * A sophisticated source selection system that ensures:
 * 1. Citation diversity - No duplicate sources within a single feedback
 * 2. Category-correct routing - Opening sources for opening issues, etc.
 * 3. Multi-factor scoring - Relevance, authority, aspect, college, teaching value
 * 4. Citation limits - Prevent over-citation (max 4 per feedback)
 * 5. Trigger prioritization - Select most impactful citations first
 *
 * This orchestrator sees ALL triggers for a feedback response upfront,
 * enabling globally optimal source selection rather than greedy per-trigger selection.
 */

import type { CitationTrigger, DeepResearchCategory } from './citationTriggerDetector';
import type { SelectedCitation } from '../types/provenanceTypes';
import type { LabeledSource, EnhancedLabeledSource, CollegeId, ClicheSymptomType } from '../types/labeledSourceTypes';

// Import source data accessors (using the ALL_* aggregated exports)
import { ALL_SHOW_DONT_TELL_SOURCES } from '../data/showDontTellSources';
import { ALL_EMOTIONAL_INTELLIGENCE_SOURCES } from '../data/emotionalIntelligenceSources';
import { ALL_INTELLECTUAL_DEPTH_SOURCES } from '../data/intellectualDepthSources';
import { ALL_PROSE_QUALITY_SOURCES } from '../data/proseQualitySources';
import { ESSAY_OPENINGS_SOURCES } from '../data/essayOpeningsSources';
import { ESSAY_ENDINGS_SOURCES } from '../data/essayEndingsSources';
import { LABELED_SOURCES } from '../data/labeledSources';

// ============================================================================
// TYPES
// ============================================================================

export interface OrchestratorConfig {
  /** Maximum citations per feedback field */
  limits: {
    problem: number;
    why_matters: number;
    how_to_fix: number;
    total: number;
  };
  /** Minimum score threshold for source selection */
  minScore: number;
  /** Whether to enforce strict category matching */
  strictCategoryMatch: boolean;
}

export interface ScoredSource {
  source: EnhancedLabeledSource | LabeledSource;
  score: number;
  breakdown: {
    issueRelevance: number;
    categoryAlignment: number;
    authorityDiversity: number;
    aspectDiversity: number;
    collegeSpecificity: number;
    teachingValue: number;
    freshnessPenalty: number;
  };
}

export interface OrchestratorResult {
  selections: Map<CitationTrigger, SelectedCitation>;
  metadata: {
    triggersReceived: number;
    triggersProcessed: number;
    citationsProduced: number;
    diversityMetrics: {
      uniqueSources: number;
      uniqueAuthors: number;
      uniqueAuthorityTypes: number;
      uniqueAspects: number;
    };
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: OrchestratorConfig = {
  limits: {
    problem: 2,
    why_matters: 2,
    how_to_fix: 1,
    total: 4,
  },
  minScore: 30,
  strictCategoryMatch: false,
};

/**
 * Maps deep research categories to their primary and secondary source pools.
 * Primary pools are category-specific sources; secondary are fallbacks.
 */
const CATEGORY_SOURCE_POOLS: Record<DeepResearchCategory, {
  primary: () => (EnhancedLabeledSource | LabeledSource)[];
  secondary: () => (EnhancedLabeledSource | LabeledSource)[];
  issueTypes: string[];
}> = {
  essay_endings: {
    primary: () => ESSAY_ENDINGS_SOURCES,
    secondary: () => LABELED_SOURCES,
    issueTypes: [
      'weak_ending', 'abrupt_ending', 'summary_conclusion', 'preachy_ending',
      'excited_to_attend_ending', 'career_announcement_ending', 'sudden_pivot_ending',
      'false_resolution_ending', 'overexplained_ending', 'anticlimactic_ending',
      'repetitive_ending', 'abstract_ending', 'academic_ending', 'generic_ending',
    ],
  },
  opening_hook: {
    primary: () => ESSAY_OPENINGS_SOURCES,
    secondary: () => LABELED_SOURCES,
    issueTypes: [
      'dictionary_definition_opening', 'childhood_opening_cliche', 'famous_quote_opening',
      'rhetorical_question_flat', 'thesis_statement_opening', 'melodramatic_opening',
      'generic_scene_setting', 'weak_opening', 'generic_opening',
    ],
  },
  show_dont_tell: {
    primary: () => ALL_SHOW_DONT_TELL_SOURCES,
    secondary: () => ALL_EMOTIONAL_INTELLIGENCE_SOURCES,
    issueTypes: [
      'telling_not_showing', 'vague_language', 'abstract_statements',
      'generic_claims', 'emotional_labeling',
    ],
  },
  emotional_intelligence: {
    primary: () => ALL_EMOTIONAL_INTELLIGENCE_SOURCES,
    secondary: () => ALL_INTELLECTUAL_DEPTH_SOURCES,
    issueTypes: [
      'surface_level_reflection', 'performative_authenticity', 'emotional_avoidance',
      'forced_positivity', 'unearned_resolution',
    ],
  },
  intellectual_depth: {
    primary: () => ALL_INTELLECTUAL_DEPTH_SOURCES,
    secondary: () => ALL_EMOTIONAL_INTELLIGENCE_SOURCES,
    issueTypes: [
      'superficial_analysis', 'binary_thinking', 'missing_nuance',
      'unsupported_claims', 'shallow_reflection',
    ],
  },
  prose_quality: {
    primary: () => ALL_PROSE_QUALITY_SOURCES,
    secondary: () => ALL_SHOW_DONT_TELL_SOURCES,
    issueTypes: [
      'cliche_language', 'weak_word_choice', 'passive_voice_overuse',
      'sentence_monotony', 'unclear_structure',
    ],
  },
};

/**
 * Authority types for diversity tracking
 */
type AuthorityType = 'dean' | 'researcher' | 'counselor' | 'author' | 'unknown';

/**
 * Aspect types from issue_relevance
 */
type AspectType = 'principle' | 'warning' | 'solution' | 'example' | 'unknown';

// ============================================================================
// DIVERSE SOURCE ORCHESTRATOR
// ============================================================================

export class DiverseSourceOrchestrator {
  private config: OrchestratorConfig;

  // State for current feedback response (reset each call)
  private usedSourceIds: Set<string> = new Set();
  private usedAuthors: Set<string> = new Set();
  private usedAuthorityTypes: Set<AuthorityType> = new Set();
  private usedAspects: Set<AspectType> = new Set();
  private usedCategories: Set<string> = new Set();

  // Context for current selection
  private collegeId: CollegeId = 'stanford';
  private issueType: string = '';

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // MAIN ENTRY POINT
  // ==========================================================================

  /**
   * Select diverse sources for ALL triggers in a feedback response.
   *
   * This is the main entry point. It:
   * 1. Resets state for new feedback
   * 2. Prioritizes triggers (limit to most impactful)
   * 3. Selects best available source for each trigger
   * 4. Tracks diversity metrics
   */
  selectSourcesForFeedback(
    triggers: CitationTrigger[],
    context: {
      college_id: string;
      essay_type: string;
      issue_type?: string;
    }
  ): OrchestratorResult {
    // Reset state
    this.resetState();
    this.collegeId = (context.college_id || 'stanford') as CollegeId;
    this.issueType = context.issue_type || '';

    // Filter to only deep research triggers
    const deepResearchTriggers = triggers.filter(t =>
      this.isDeepResearchCategory(t.type)
    );

    // Prioritize and limit triggers
    const prioritizedTriggers = this.prioritizeTriggers(deepResearchTriggers);

    // Select sources for each prioritized trigger
    const selections = new Map<CitationTrigger, SelectedCitation>();

    for (const trigger of prioritizedTriggers) {
      const selection = this.selectBestAvailableSource(trigger);
      if (selection) {
        selections.set(trigger, selection);
        this.markSourceUsed(selection);
      }
    }

    return {
      selections,
      metadata: {
        triggersReceived: triggers.length,
        triggersProcessed: prioritizedTriggers.length,
        citationsProduced: selections.size,
        diversityMetrics: {
          uniqueSources: this.usedSourceIds.size,
          uniqueAuthors: this.usedAuthors.size,
          uniqueAuthorityTypes: this.usedAuthorityTypes.size,
          uniqueAspects: this.usedAspects.size,
        },
      },
    };
  }

  // ==========================================================================
  // TRIGGER PRIORITIZATION
  // ==========================================================================

  /**
   * Prioritize triggers and apply citation limits.
   *
   * Priority factors:
   * 1. Location importance (why_matters > problem > how_to_fix)
   * 2. Anchor text length (longer = more specific match)
   * 3. Issue centrality (matches primary issue type)
   */
  private prioritizeTriggers(triggers: CitationTrigger[]): CitationTrigger[] {
    // Score each trigger
    const scored = triggers.map(trigger => ({
      trigger,
      priority: this.calculateTriggerPriority(trigger),
    }));

    // Sort by priority descending
    scored.sort((a, b) => b.priority - a.priority);

    // Apply limits per location
    const selected: CitationTrigger[] = [];
    const countByLocation: Record<string, number> = {
      problem: 0,
      why_matters: 0,
      how_to_fix: 0,
    };

    for (const { trigger } of scored) {
      // Check total limit
      if (selected.length >= this.config.limits.total) break;

      // Check per-location limit
      const locationLimit = this.config.limits[trigger.location as keyof typeof this.config.limits];
      if (typeof locationLimit === 'number' && countByLocation[trigger.location] >= locationLimit) {
        continue;
      }

      selected.push(trigger);
      countByLocation[trigger.location] = (countByLocation[trigger.location] || 0) + 1;
    }

    return selected;
  }

  /**
   * Calculate priority score for a trigger.
   */
  private calculateTriggerPriority(trigger: CitationTrigger): number {
    let priority = 0;

    // Location importance (why_matters is most valuable for citations)
    const locationScores: Record<string, number> = {
      why_matters: 100,  // Research backing is most impactful here
      problem: 80,       // Good for explaining what's wrong
      how_to_fix: 60,    // Less critical, action-focused
    };
    priority += locationScores[trigger.location] || 50;

    // Anchor text length (longer = more specific match)
    priority += Math.min(trigger.anchor_text.length / 2, 30);

    // Category relevance to primary issue
    if (trigger.context?.deep_research_category === this.getCategoryForIssue(this.issueType)) {
      priority += 20;
    }

    return priority;
  }

  // ==========================================================================
  // SOURCE SELECTION
  // ==========================================================================

  /**
   * Select the best available (not yet used) source for a trigger.
   */
  private selectBestAvailableSource(trigger: CitationTrigger): SelectedCitation | null {
    const category = trigger.type as DeepResearchCategory;

    // Get candidate sources from appropriate pool
    const candidates = this.getCandidatePool(category);

    if (candidates.length === 0) {
      return null;
    }

    // Score all candidates
    const scored = candidates.map(source => this.scoreSource(source, trigger));

    // Sort by total score descending
    scored.sort((a, b) => b.score - a.score);

    // Find best viable candidate (score > minScore and not eliminated)
    const best = scored.find(s => s.score >= this.config.minScore);

    if (!best) {
      return null;
    }

    return this.convertToSelectedCitation(best.source, category);
  }

  /**
   * Get candidate source pool for a category.
   * Uses primary pool first, falls back to secondary if needed.
   */
  private getCandidatePool(category: DeepResearchCategory): (EnhancedLabeledSource | LabeledSource)[] {
    const poolConfig = CATEGORY_SOURCE_POOLS[category];

    if (!poolConfig) {
      // Unknown category, use all labeled sources
      return LABELED_SOURCES;
    }

    const primarySources = poolConfig.primary();
    const secondarySources = poolConfig.secondary();

    // Check if we need secondary sources (primary exhausted or too few)
    const availablePrimary = primarySources.filter(s => !this.usedSourceIds.has(this.getSourceId(s)));

    if (availablePrimary.length >= 3) {
      return primarySources; // Primary pool has enough
    }

    // Combine pools, primary first
    return [...primarySources, ...secondarySources];
  }

  // ==========================================================================
  // MULTI-FACTOR SCORING
  // ==========================================================================

  /**
   * Calculate multi-factor score for a source.
   *
   * Factors:
   * - Issue Relevance: 0-100 (from source's issue_relevance data)
   * - Category Alignment: 0-30 (bonus for category-correct source)
   * - Authority Diversity: 0-20 (bonus for new authority type)
   * - Aspect Diversity: 0-15 (bonus for new aspect type)
   * - College Specificity: 0-15 (bonus for target college)
   * - Teaching Value: 0-10 (bonus for teaching_implication)
   * - Freshness Penalty: 0 to -1000 (penalty for used sources)
   */
  private scoreSource(
    source: EnhancedLabeledSource | LabeledSource,
    trigger: CitationTrigger
  ): ScoredSource {
    const breakdown = {
      issueRelevance: 0,
      categoryAlignment: 0,
      authorityDiversity: 0,
      aspectDiversity: 0,
      collegeSpecificity: 0,
      teachingValue: 0,
      freshnessPenalty: 0,
    };

    const sourceId = this.getSourceId(source);
    const category = trigger.type as DeepResearchCategory;

    // FACTOR 1: Issue Relevance (0-100)
    const relevanceData = this.getIssueRelevance(source, this.issueType);
    breakdown.issueRelevance = relevanceData.score;

    // FACTOR 2: Category Alignment (0-30)
    if (this.isSourceInCategory(source, category)) {
      breakdown.categoryAlignment = 30;
    }

    // FACTOR 3: Authority Diversity (0-20)
    const authorityType = this.getAuthorityType(source);
    if (!this.usedAuthorityTypes.has(authorityType)) {
      breakdown.authorityDiversity = 20;
    }

    // FACTOR 4: Aspect Diversity (0-15)
    const aspectType = relevanceData.aspect;
    if (aspectType !== 'unknown' && !this.usedAspects.has(aspectType)) {
      breakdown.aspectDiversity = 15;
    }

    // FACTOR 5: College Specificity (0-15)
    const sourceCollege = this.getSourceCollege(source);
    if (sourceCollege === this.collegeId) {
      breakdown.collegeSpecificity = 15;
    } else if (this.sourceAppliesToCollege(source, this.collegeId)) {
      breakdown.collegeSpecificity = 10;
    }

    // FACTOR 6: Teaching Value (0-10)
    if (this.hasTeachingImplication(source)) {
      breakdown.teachingValue = 10;
    }

    // FACTOR 7: Freshness Penalty
    if (this.usedSourceIds.has(sourceId)) {
      breakdown.freshnessPenalty = -1000; // Eliminate
    } else if (source.author && this.usedAuthors.has(source.author)) {
      breakdown.freshnessPenalty = -30; // Discourage same author
    } else if (this.usedCategories.has(category)) {
      breakdown.freshnessPenalty = -5; // Mild penalty for same category
    }

    const score =
      breakdown.issueRelevance +
      breakdown.categoryAlignment +
      breakdown.authorityDiversity +
      breakdown.aspectDiversity +
      breakdown.collegeSpecificity +
      breakdown.teachingValue +
      breakdown.freshnessPenalty;

    return { source, score, breakdown };
  }

  // ==========================================================================
  // SOURCE DATA HELPERS
  // ==========================================================================

  private getSourceId(source: EnhancedLabeledSource | LabeledSource): string {
    return (source as any).id || `${source.author}_${source.quote?.substring(0, 20)}`;
  }

  private getIssueRelevance(
    source: EnhancedLabeledSource | LabeledSource,
    issueType: string
  ): { score: number; aspect: AspectType } {
    const enhanced = source as EnhancedLabeledSource;

    if (enhanced.issue_relevance && enhanced.issue_relevance[issueType]) {
      const relevance = enhanced.issue_relevance[issueType];
      return {
        score: relevance.score || 40,
        aspect: (relevance.aspect as AspectType) || 'unknown',
      };
    }

    // Fallback: estimate based on keywords in quote
    const quote = source.quote?.toLowerCase() || '';
    let score = 40; // Base score

    // Boost if quote contains issue-related keywords
    if (issueType.includes('ending') && (quote.includes('end') || quote.includes('conclusion'))) {
      score += 20;
    }
    if (issueType.includes('opening') && (quote.includes('open') || quote.includes('start') || quote.includes('begin'))) {
      score += 20;
    }
    if (issueType.includes('showing') && (quote.includes('show') || quote.includes('detail') || quote.includes('specific'))) {
      score += 20;
    }

    return { score, aspect: 'unknown' };
  }

  private isSourceInCategory(
    source: EnhancedLabeledSource | LabeledSource,
    category: DeepResearchCategory
  ): boolean {
    const enhanced = source as EnhancedLabeledSource;

    // Check taxonomy
    if (enhanced.taxonomy?.primary_category) {
      const categoryMap: Record<string, DeepResearchCategory[]> = {
        essay_endings: ['essay_endings'],
        opening_hooks: ['opening_hook'],
        show_dont_tell: ['show_dont_tell'],
        emotional_intelligence: ['emotional_intelligence'],
        intellectual_depth: ['intellectual_depth'],
        prose_quality: ['prose_quality'],
        vulnerability: ['emotional_intelligence'],
        specificity: ['show_dont_tell'],
        closure: ['essay_endings'],
      };

      const matchingCategories = categoryMap[enhanced.taxonomy.primary_category] || [];
      if (matchingCategories.includes(category)) {
        return true;
      }
    }

    // Check if source is from the category's primary pool
    const poolConfig = CATEGORY_SOURCE_POOLS[category];
    if (poolConfig) {
      const primarySources = poolConfig.primary();
      const sourceId = this.getSourceId(source);
      return primarySources.some(s => this.getSourceId(s) === sourceId);
    }

    return false;
  }

  private getAuthorityType(source: EnhancedLabeledSource | LabeledSource): AuthorityType {
    const author = source.author?.toLowerCase() || '';
    const title = (source.author_title || '').toLowerCase();
    const sourceType = (source as EnhancedLabeledSource).source_type?.toLowerCase() || '';

    if (title.includes('dean') || author.includes('dean')) return 'dean';
    if (sourceType.includes('research') || sourceType.includes('study') || sourceType.includes('neuroscience')) return 'researcher';
    if (title.includes('counselor') || sourceType.includes('counselor')) return 'counselor';
    if (sourceType.includes('author') || sourceType.includes('writer')) return 'author';

    return 'unknown';
  }

  private getSourceCollege(source: EnhancedLabeledSource | LabeledSource): string | undefined {
    return (source as any).college || (source as EnhancedLabeledSource).scope?.applies_to?.colleges?.[0];
  }

  private sourceAppliesToCollege(source: EnhancedLabeledSource | LabeledSource, college: CollegeId): boolean {
    const enhanced = source as EnhancedLabeledSource;

    if (enhanced.scope?.applies_to?.colleges) {
      return enhanced.scope.applies_to.colleges.includes(college as any);
    }

    // Universal sources apply to all colleges
    if (enhanced.scope?.level === 'universal') {
      return true;
    }

    return false;
  }

  private hasTeachingImplication(source: EnhancedLabeledSource | LabeledSource): boolean {
    return !!(source as any).teaching_implication;
  }

  private getCategoryForIssue(issueType: string): DeepResearchCategory | undefined {
    for (const [category, config] of Object.entries(CATEGORY_SOURCE_POOLS)) {
      if (config.issueTypes.includes(issueType)) {
        return category as DeepResearchCategory;
      }
    }
    return undefined;
  }

  private isDeepResearchCategory(type: string): type is DeepResearchCategory {
    return type in CATEGORY_SOURCE_POOLS;
  }

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  private resetState(): void {
    this.usedSourceIds.clear();
    this.usedAuthors.clear();
    this.usedAuthorityTypes.clear();
    this.usedAspects.clear();
    this.usedCategories.clear();
  }

  private markSourceUsed(citation: SelectedCitation): void {
    const source = citation.citation;

    // Track source ID
    const sourceId = `${source.author}_${source.quote?.substring(0, 20)}`;
    this.usedSourceIds.add(sourceId);

    // Track author
    if (source.author) {
      this.usedAuthors.add(source.author);
    }

    // Track authority type
    const authorityType = this.inferAuthorityTypeFromCitation(citation);
    this.usedAuthorityTypes.add(authorityType);

    // Track aspect (from relevance matches if available)
    const aspect = this.inferAspectFromCitation(citation);
    if (aspect !== 'unknown') {
      this.usedAspects.add(aspect);
    }
  }

  private inferAuthorityTypeFromCitation(citation: SelectedCitation): AuthorityType {
    const type = citation.citation.type;
    if (type === 'dean_quote') return 'dean';
    if (type === 'internal_analysis') return 'researcher';
    return 'unknown';
  }

  private inferAspectFromCitation(citation: SelectedCitation): AspectType {
    // Try to infer from relevance matches
    const matches = citation.relevance?.matches || [];
    for (const match of matches) {
      if (['principle', 'warning', 'solution', 'example'].includes(match)) {
        return match as AspectType;
      }
    }
    return 'unknown';
  }

  // ==========================================================================
  // CITATION CONVERSION
  // ==========================================================================

  /**
   * Convert a LabeledSource to SelectedCitation format.
   */
  private convertToSelectedCitation(
    source: EnhancedLabeledSource | LabeledSource,
    category: DeepResearchCategory
  ): SelectedCitation {
    const authorityType = this.getAuthorityType(source);
    const citationType = authorityType === 'dean' ? 'dean_quote'
      : authorityType === 'researcher' ? 'internal_analysis'
      : 'dean_quote';

    const relevanceData = this.getIssueRelevance(source, this.issueType);

    return {
      citation: {
        type: citationType,
        author: source.author,
        author_title: source.author_title || this.formatAuthorityType(authorityType),
        quote: source.quote,
        finding: source.quote,
        publication: source.publication || source.college || 'Admissions Research',
        date: source.year?.toString() || '2024',
        title: `${this.formatCategoryName(category)} Insight`,
      },
      relevance: {
        score: relevanceData.score,
        reason: `${this.formatAuthorityType(authorityType)} insight on ${this.formatCategoryName(category)}`,
        matches: [category, relevanceData.aspect],
      },
      presentation: {
        simplified_version: source.quote
          ? (source.quote.length > 100 ? source.quote.substring(0, 97) + '...' : source.quote)
          : 'Research-backed insight',
        full_version: this.buildFullPresentation(source, category),
      },
    };
  }

  private formatAuthorityType(type: AuthorityType): string {
    const formats: Record<AuthorityType, string> = {
      dean: 'Dean of Admissions',
      researcher: 'Research Study',
      counselor: 'College Counselor',
      author: 'Writing Expert',
      unknown: 'Admissions Expert',
    };
    return formats[type];
  }

  private formatCategoryName(category: DeepResearchCategory): string {
    const names: Record<DeepResearchCategory, string> = {
      show_dont_tell: 'Show Don\'t Tell',
      emotional_intelligence: 'Emotional Intelligence',
      intellectual_depth: 'Intellectual Depth',
      prose_quality: 'Prose Quality',
      opening_hook: 'Essay Openings',
      essay_endings: 'Essay Endings',
    };
    return names[category] || category;
  }

  private buildFullPresentation(
    source: EnhancedLabeledSource | LabeledSource,
    category: DeepResearchCategory
  ): string {
    const parts: string[] = [];

    // Author attribution
    if (source.author) {
      const title = source.author_title || this.formatAuthorityType(this.getAuthorityType(source));
      parts.push(`**${source.author}** (${title})`);
    }

    // The quote
    if (source.quote) {
      parts.push(`\n"${source.quote}"`);
    }

    // Category context
    parts.push(`\n*Category: ${this.formatCategoryName(category)}*`);

    // Teaching implication if available
    const teaching = (source as any).teaching_implication;
    if (teaching) {
      parts.push(`\n**Teaching takeaway:** ${teaching}`);
    }

    // Source details
    if (source.publication && source.year) {
      parts.push(`\n\nSource: ${source.publication}, ${source.year}`);
    } else if (source.college) {
      parts.push(`\n\nFrom: ${source.college} admissions insights`);
    }

    return parts.join('');
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const diverseSourceOrchestrator = new DiverseSourceOrchestrator();
